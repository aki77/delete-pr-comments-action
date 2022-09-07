# Delete PR review comments

Delete PR review comments by any conditions.

### Inputs

- `token` - The GITHUB_TOKEN secret.
- `bodyContains` - String contained in the comment to be deleted. (default: ``)
- `noReply`: Delete only comments with no replies. (default: `false`)

## Example

```yaml
name: Tests
on:
  pull_request:

jobs:
  build:
    steps:
      - uses: aki77/delete-pr-comments-action@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          bodyContains: "[eslint]"
      - uses: reviewdog/action-eslint@v1
```
