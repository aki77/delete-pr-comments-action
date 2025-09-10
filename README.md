# Delete PR review comments

Delete PR review comments by any conditions. This action can delete both line-specific review comments and overall review comments.

## Inputs

See [action.yml](action.yml)

| Name | Description | Default | Required |
| - | - | - | - |
| `token` | GITHUB_TOKEN | `${{ github.token }}` | no |
| `bodyContains` | Delete only comments containing strings | `` | no |
| `noReply` | Delete only comments with no replies | false | no |
| `pullRequestNumber` | Delete comments on specified PR | `` | no |
| `usernames` | Delete only comments posted by specified usernames (newline separated) | `` | no |
| `includeIssueComments` | Include PR issue comments in deletion targets | false | no |
| `includeOverallReviewComments` | Include overall review comments in deletion targets (will be hidden) | false | no |
| `onlyNotMinimized` | Delete only comments that are not minimized (hidden) | false | no |

  You can specify multiple strings by putting each string on its own line:

  ```yaml
  bodyContains: |-
    [eslint]
    [reviewdog]
  ```

  You can specify multiple usernames by putting each username on its own line:

  ```yaml
  usernames: |-
    dependabot[bot]
    claude[bot]
  ```

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
