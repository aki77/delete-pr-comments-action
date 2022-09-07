import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<void> {
  try {
    const pullNumber = github.context.issue.number
    if (!pullNumber) {
      core.warning('Cannot find the PR id.')
      return
    }

    const token = core.getInput('token', {required: true})
    const bodyContains = core.getInput('bodyContains', {required: true})
    core.debug(`bodyContains: ${JSON.stringify(bodyContains)}`)

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

    const comments = response.data.filter(comment => {
      return comment.body?.includes(bodyContains)
    })
    core.debug(
      `Found ${comments.length} comments with body containing ${bodyContains}`
    )

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
