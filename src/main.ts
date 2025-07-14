import * as core from '@actions/core'
import * as github from '@actions/github'

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
    core.debug(`bodyContains: ${JSON.stringify(searchStrings)}`)
    core.debug(`usernames: ${JSON.stringify(targetUsernames)}`)
    core.debug(`pull_number: ${pullNumber}`)

    const octokit = github.getOctokit(token)
    const response = await octokit.rest.pulls.listReviewComments({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: pullNumber,
      per_page: 100,
      sort: 'created',
      direction: 'desc'
    })

    core.debug(`Comment count: ${response.data.length}`)
    core.debug(`Comments: ${JSON.stringify(response.data)}`)

    const commentIdsWithReply = response.data
      .map(({in_reply_to_id}) => in_reply_to_id)
      .filter((id): id is number => !!id)
    const commentIdsWithReplySet = new Set(commentIdsWithReply)

    const comments = response.data.filter(comment => {
      if (
        searchStrings.every(
          (searchString: string) => !comment.body.includes(searchString)
        )
      ) {
        return false
      }

      if (targetUsernames.length > 0 && !targetUsernames.includes(comment.user.login)) {
        return false
      }

      if (noReply === 'true' && commentIdsWithReplySet.has(comment.id)) {
        return false
      }

      return true
    })
    core.debug(`Found ${comments.length} comments with match conditions.`)

    for (const comment of comments) {
      await octokit.rest.pulls.deleteReviewComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        comment_id: comment.id
      })
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
