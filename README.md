# Delete PR review comments

Delete PR review comments by any conditions. This action can delete both line-specific review comments and overall review comments. It's handy for automatically cleaning up stale bot comments from tools like reviewdog, dependabot, or Claude Code between CI runs.

The token needs `pull-requests: write` permission:

```yaml
permissions:
  pull-requests: write
```

## Inputs

See [action.yml](action.yml)

| Name | Description | Default | Required |
| - | - | - | - |
| `token` | GITHUB_TOKEN | `${{ github.token }}` | no |
| `bodyContains` | Delete only comments containing strings | `` | no |
| `noReply` | Delete only comments with no replies (line-specific review comments only) | false | no |
| `pullRequestNumber` | Delete comments on specified PR (auto-detected from `pull_request` event context if omitted; required for other events, e.g. `workflow_dispatch`) | `` | no |
| `usernames` | Delete only comments posted by specified usernames (newline separated) | `` | no |
| `includeIssueComments` | Include PR issue comments (standalone comments in the Conversation tab) in deletion targets | false | no |
| `includeOverallReviewComments` | Include overall review comments (the summary text attached to a submitted review) in deletion targets — these are hidden, not deleted, since GitHub's API has no way to delete a review | false | no |
| `onlyNotMinimized` | Delete only comments that are not minimized (hidden), skipping comments already hidden (e.g. by a previous `includeOverallReviewComments` run) | false | no |

  You can specify multiple strings by putting each string on its own line. A comment matches if it contains **any** of the strings:

  ```yaml
  bodyContains: |-
    [eslint]
    [reviewdog]
  ```

  You can specify multiple usernames by putting each username on its own line. A comment matches if it was posted by **any** of the listed usernames:

  ```yaml
  usernames: |-
    dependabot[bot]
    claude[bot]
  ```

  When multiple inputs are set (`bodyContains`, `usernames`, `noReply`), a comment must satisfy **all** of them to be deleted.

### Notes

- Each comment type (review comments, issue comments, reviews) is fetched up to 100 items; PRs with more than 100 won't have older items considered.
- If the target PR number can't be determined, the action logs a warning and exits without failing the job.

## Examples

### Delete comments by content

```yaml
name: Tests
on:
  pull_request:

jobs:
  build:
    steps:
      - uses: aki77/delete-pr-comments-action@v3
        with:
          bodyContains: |-
            [eslint]
            [reviewdog]
          noReply: 'true'
      - uses: reviewdog/action-eslint@v1
```

### Delete comments by specific users

```yaml
name: Delete bot comments
on:
  pull_request:

jobs:
  cleanup:
    steps:
      - uses: aki77/delete-pr-comments-action@v3
        with:
          usernames: |-
            dependabot[bot]
            claude[bot]
```

### Delete comments by both content and users

```yaml
name: Cleanup comments
on:
  pull_request:

jobs:
  cleanup:
    steps:
      - uses: aki77/delete-pr-comments-action@v3
        with:
          bodyContains: 'outdated'
          usernames: 'github-actions[bot]'
          noReply: 'true'
```

### Delete both issue comments and overall review comments

```yaml
name: Delete review comments
on:
  pull_request:

jobs:
  cleanup:
    steps:
      - uses: aki77/delete-pr-comments-action@v3
        with:
          includeIssueComments: 'true'
          includeOverallReviewComments: 'true'
          usernames: claude[bot]
```

### Delete only non-minimized comments

```yaml
name: Delete visible comments only
on:
  pull_request:

jobs:
  cleanup:
    steps:
      - uses: aki77/delete-pr-comments-action@v3
        with:
          bodyContains: 'outdated'
          onlyNotMinimized: 'true'
```

### Delete comments outside a `pull_request` event

When triggered by an event without PR context (e.g. `workflow_dispatch`), specify `pullRequestNumber` explicitly:

```yaml
name: Cleanup comments manually
on:
  workflow_dispatch:
    inputs:
      pr_number:
        required: true

jobs:
  cleanup:
    steps:
      - uses: aki77/delete-pr-comments-action@v3
        with:
          pullRequestNumber: ${{ inputs.pr_number }}
          usernames: claude[bot]
```
