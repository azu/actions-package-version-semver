# actions-package-version-semver

GitHub Actions that set "semver" output from commit diff of `package.json`/`lerna.json`.

## Usage

See [action.yml](action.yml)

```yaml
- id: semver
  uses: azu/actions-package-version-semver@v1
- name: Print steps context output
  run: |
    echo 'steps.semver.outputs.semver=${{ steps.semver.outputs.semver }}'
```

## UseCase

### Set semver label to PullRequest

```
name: Test

on:
  pull_request:

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: setup Node.js
        uses: actions/setup-node@v1
        with:
          node-version: '12.x'
      - name: Install dependencies
        run: |
          yarn install && yarn all
      - id: semver
        name: Run the action
        uses: ./
      - name: Print steps context output
        if: steps.semver.outputs.semver != ''
        run: |
          echo 'steps.semver.outputs.semver=${{ steps.semver.outputs.semver }}'
      - name: Print No semver
        if: steps.semver.outputs.semver == ''
        run: |
          echo 'No update'
      - name: Semver Label
        if: steps.semver.outputs.semver != ''
        uses: buildsville/add-remove-label@v1
        with:
          token: ${{secrets.GITHUB_TOKEN}}
          labels: "Semver: ${{steps.semver.outputs.semver}}"
          type: add
      - name: Remove No Update Label
        if: steps.semver.outputs.semver != ''
        uses: buildsville/add-remove-label@v1
        with:
          token: ${{secrets.GITHUB_TOKEN}}
          labels: "Semver: No Update"
          type: remove
      - name: Add No Update Label
        if: steps.semver.outputs.semver == ''
        uses: buildsville/add-remove-label@v1
        with:
          token: ${{secrets.GITHUB_TOKEN}}
          labels: "Semver: No Update"
          type: add

```
## Release Flow

```
npm version {patch,minor,major}
git push
```

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

MIT
