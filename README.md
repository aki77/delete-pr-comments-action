# Delete comments

Delete comments from issue/pr by any conditions.

### Inputs

- `token` - The GITHUB_TOKEN secret.
- `bodyContains` - String contained in the comment to be deleted.

## Example

```yaml
name: Tests
on:
  pull_request:

jobs:
  build:
    steps:
      - uses: aki77/delete-comments-action@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          bodyContains: "[eslint]"
      - uses: reviewdog/action-eslint@v1
```
