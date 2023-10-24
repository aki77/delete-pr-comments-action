# Delete PR review comments

Delete PR review comments by any conditions.

### Inputs

- `token` - The GITHUB_TOKEN secret.
- `noReply`: Delete only comments with no replies. (default: `false`)
- `bodyContains` - String contained in the comment to be deleted. (default: ``)

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
          token: ${{ secrets.GITHUB_TOKEN }}
          bodyContains: |-
            [eslint]
            [reviewdog]
          noReply: 'true'
      - uses: reviewdog/action-eslint@v1
```
