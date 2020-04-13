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

Support `lerna.json`:

```yaml
- id: semver
  uses: azu/actions-package-version-semver@v1
  with:
    package_version_filename: lerna.json
- name: Print steps context output
  run: |
    echo 'steps.semver.outputs.semver=${{ steps.semver.outputs.semver }}'
```

## UseCase

### Set semver label to PullRequest

Update Pull Request's label when commit new version onto the Pull Request.

- Update `package.json`'s `version`: Add `Semver: ${type}`
- No update `package.json`'s `version`: Add `Semver: No Update`

Example PR: [2.0.0 by azu · Pull Request #4 · azu/actions-package-version-semver](https://github.com/azu/actions-package-version-semver/pull/4)

```yaml
name: PR Semver Label

on:
  pull_request:

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - name: actions-package-version-semver
        id: semver
        uses: azu/actions-package-version-semver@v1
      - name: Add Semver Label
        if: steps.semver.outputs.semver != ''
        uses: actions/github-script@0.9.0
        with:
          github-token: ${{secrets.GITHUB_TOKEN}}
          script: |
            github.issues.addLabels({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              labels: ['Semver: ${{steps.semver.outputs.semver}}']
            });
            github.issues.removeLabel({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              name: 'Semver: No Update'
            }).catch(error => {})
      - name: Add No Update Label
        if: steps.semver.outputs.semver == ''
        uses: actions/github-script@0.9.0
        with:
          github-token: ${{secrets.GITHUB_TOKEN}}
          script: |
            github.issues.addLabels({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              labels: ['Semver: No Update']
            });


```

## Release Flow

```
npm version {patch,minor,major}
git push && git push --tags
```

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

MIT
