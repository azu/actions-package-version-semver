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

- [ ] 

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
