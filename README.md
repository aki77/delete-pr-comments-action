# Delete PR review comments

Delete PR review comments by any conditions.

## Inputs

See [action.yml](action.yml)

| Name | Description | Default | Required |
| - | - | - | - |
| `token` | GITHUB_TOKEN | `${{ github.token }}` | no |
| `noReply` | Delete only comments with no replies | false | no |
| `bodyContains` | String contained in the comment to be deleted | `` | no |

  You can specify multiple strings by putting each string on its own line:

  ```yaml
  bodyContains: |-
    [eslint]
    [reviewdog]
  ```

## Example

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
