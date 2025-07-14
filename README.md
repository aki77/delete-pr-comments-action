# Delete PR review comments

Delete PR review comments by any conditions.

## Inputs

See [action.yml](action.yml)

| Name | Description | Default | Required |
| - | - | - | - |
| `token` | GITHUB_TOKEN | `${{ github.token }}` | no |
| `noReply` | Delete only comments with no replies | false | no |
| `bodyContains` | String contained in the comment to be deleted | `` | no |
| `usernames` | Delete only comments posted by specified usernames | `` | no |
| `pullRequestNumber` | Delete comments on specified PR | `` | no |

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
      - uses: aki77/delete-pr-comments-action@v2
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
      - uses: aki77/delete-pr-comments-action@v2
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
      - uses: aki77/delete-pr-comments-action@v2
        with:
          bodyContains: 'outdated'
          usernames: 'github-actions[bot]'
          noReply: 'true'
```
