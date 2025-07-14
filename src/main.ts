import * as core from '@actions/core'
import * as github from '@actions/github'

const minimizeComment = async (octokit: ReturnType<typeof github.getOctokit>, nodeId: string, reason: string = 'OUTDATED'): Promise<void> => {
  await octokit.graphql(`
    mutation minimizeComment($id: ID!, $classifier: ReportedContentClassifiers!) {
      minimizeComment(input: { subjectId: $id, classifier: $classifier }) {
        minimizedComment {
          isMinimized
          minimizedReason
        }
      }
    }
  `, {
    id: nodeId,
    classifier: reason
  })
}

type ReviewComment = {
  id: number
  body: string
  user: {
    login: string
  } | null
  in_reply_to_id?: number | null
}

type IssueComment = {
  id: number
  body: string
  user: {
    login: string
  } | null
  pull_request_review_id?: number | null
}

type ReviewOverallComment = {
  id: number
  body: string
  user: {
    login: string
  } | null
  state: 'PENDING' | 'COMMENTED' | 'APPROVED' | 'CHANGES_REQUESTED'
  submitted_at: string | null
  node_id: string
}

type Comment = ReviewComment | IssueComment | ReviewOverallComment

const parseBodyContains = (bodyContains: string): readonly string[] => {
  if (bodyContains.length === 0) {
    return []
  }

  return bodyContains
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
}

const parseUsernames = (usernames: string): readonly string[] => {
  if (usernames.length === 0) {
    return []
  }

  return usernames
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
}

const filterComments = (
  comments: Comment[],
  searchStrings: readonly string[],
  targetUsernames: readonly string[],
  noReply: string,
  commentIdsWithReplySet: Set<number>
): Comment[] => {
  return comments.filter(comment => {
    // Filter by search strings
    if (
      searchStrings.length > 0 &&
      searchStrings.every(
        (searchString: string) => !comment.body.includes(searchString)
      )
    ) {
      return false
    }

    // Filter by usernames
    if (
      targetUsernames.length > 0 &&
      (!comment.user || !targetUsernames.includes(comment.user.login))
    ) {
      return false
    }

    // noReply filter only applies to review comments (line-specific comments)
    if (
      noReply === 'true' &&
      !('state' in comment) && // Not an overall review comment
      !('pull_request_review_id' in comment) && // Not an issue comment
      commentIdsWithReplySet.has(comment.id)
    ) {
      return false
    }

    return true
  })
}

async function run(): Promise<void> {
  try {
    const pullNumberFromInputs = core.getInput('pullRequestNumber')
    const pullNumber = pullNumberFromInputs
      ? Number.parseInt(pullNumberFromInputs)
      : github.context.issue.number

    if (!pullNumber) {
      core.warning(
        `Cannot find the PR id. Pull request number from inputs: ${pullNumberFromInputs} and from context: ${github.context.issue.number}`
      )
      return
    }

    const token = core.getInput('token', {required: true})
    const searchStrings = parseBodyContains(core.getInput('bodyContains'))
    const targetUsernames = parseUsernames(core.getInput('usernames'))
    const noReply = core.getInput('noReply')
    const includeIssueComments = core.getInput('includeIssueComments')
    const includeOverallReviewComments = core.getInput('includeOverallReviewComments')
    core.debug(`bodyContains: ${JSON.stringify(searchStrings)}`)
    core.debug(`usernames: ${JSON.stringify(targetUsernames)}`)
    core.debug(`pull_number: ${pullNumber}`)

    const octokit = github.getOctokit(token)

    // Get PR review comments (line-specific comments)
    const reviewCommentsResponse = await octokit.rest.pulls.listReviewComments({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: pullNumber,
      per_page: 100,
      sort: 'created',
      direction: 'desc'
    })

    // Get PR issue comments (including overall review comments)
    let issueComments: IssueComment[] = []
    if (includeIssueComments === 'true') {
      const issueCommentsResponse = await octokit.rest.issues.listComments({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: pullNumber,
        per_page: 100,
        sort: 'created',
        direction: 'desc'
      })
      // Filter to only include review comments (those with pull_request_review_id)
      // Use type assertion since GitHub API doesn't include pull_request_review_id in its type definitions
      type APIComment = (typeof issueCommentsResponse.data)[0] & {
        pull_request_review_id?: number | null
      }

      issueComments = (issueCommentsResponse.data as APIComment[])
        .filter(
          (comment): comment is APIComment & {pull_request_review_id: number} =>
            comment.pull_request_review_id !== null &&
            comment.pull_request_review_id !== undefined
        )
        .map(comment => ({
          id: comment.id,
          body: comment.body || '',
          user: comment.user,
          pull_request_review_id: comment.pull_request_review_id
        }))
    }

    // Get overall review comments
    let overallReviewComments: ReviewOverallComment[] = []
    if (includeOverallReviewComments === 'true') {
      const reviewsResponse = await octokit.rest.pulls.listReviews({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: pullNumber,
        per_page: 100
      })
      
      overallReviewComments = reviewsResponse.data
        .filter(review => review.body && review.body.trim().length > 0)
        .map(review => ({
          id: review.id,
          body: review.body || '',
          user: review.user ? {
            login: review.user.login
          } : null,
          state: review.state as 'PENDING' | 'COMMENTED' | 'APPROVED' | 'CHANGES_REQUESTED',
          submitted_at: review.submitted_at || null,
          node_id: review.node_id
        }))
    }

    const allReviewComments: ReviewComment[] = reviewCommentsResponse.data.map(
      comment => ({
        id: comment.id,
        body: comment.body,
        user: comment.user,
        in_reply_to_id: comment.in_reply_to_id
      })
    )
    const allComments: Comment[] = [...allReviewComments, ...issueComments, ...overallReviewComments]

    core.debug(`Review comment count: ${allReviewComments.length}`)
    core.debug(`Issue comment count: ${issueComments.length}`)
    core.debug(`Overall review comment count: ${overallReviewComments.length}`)
    core.debug(`Total comment count: ${allComments.length}`)

    const commentIdsWithReply = allReviewComments
      .map(({in_reply_to_id}) => in_reply_to_id)
      .filter((id): id is number => !!id)
    const commentIdsWithReplySet = new Set(commentIdsWithReply)

    const filteredComments = filterComments(
      allComments,
      searchStrings,
      targetUsernames,
      noReply,
      commentIdsWithReplySet
    )
    core.debug(
      `Found ${filteredComments.length} comments with match conditions.`
    )

    for (const comment of filteredComments) {
      if ('state' in comment) {
        // This is an overall review comment → Always hide
        core.info(`Hiding review ${comment.id}: "${comment.body.substring(0, 50)}..."`)
        await minimizeComment(octokit, comment.node_id, 'OUTDATED')
      } else if ('pull_request_review_id' in comment) {
        // This is an issue comment
        core.info(`Deleting issue comment ${comment.id}: "${comment.body.substring(0, 50)}..."`)
        await octokit.rest.issues.deleteComment({
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          comment_id: comment.id
        })
      } else {
        // This is a review comment (line-specific)
        core.info(`Deleting review comment ${comment.id}: "${comment.body.substring(0, 50)}..."`)
        await octokit.rest.pulls.deleteReviewComment({
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          comment_id: comment.id
        })
      }
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
