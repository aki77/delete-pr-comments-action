import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<void> {
  try {
    const issueNumber = github.context.issue.number
    if (!issueNumber) {
      throw new Error('Could not get pull request number from context, exiting')
    }

    const token = core.getInput('token', {required: true})
    const bodyContains = core.getInput('bodyContains', {required: true})
    core.debug(`bodyContains: ${JSON.stringify(bodyContains)}`)

    const octokit = github.getOctokit(token)
    const response = await octokit.rest.issues.listComments({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: issueNumber,
      per_page: 100
    })

    core.debug(`Comment count: ${response.data.length}`)
    const comments = response.data.filter(comment => {
      return comment.body?.includes(bodyContains)
    })
    core.debug(
      `Found ${comments.length} comments with body containing ${bodyContains}`
    )

    for (const comment of comments) {
      await octokit.rest.issues.deleteComment({
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
