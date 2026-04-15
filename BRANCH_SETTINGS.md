# Branch Protection Settings

These settings must be configured manually in the GitHub UI since they cannot be set via code.

**Navigate to:** Repository → Settings → Branches → Add branch protection rule

## Rule: `main`

| Setting | Value |
|---------|-------|
| Branch name pattern | `main` |
| Require a pull request before merging | Yes |
| Required approving reviews | 1 |
| Dismiss stale pull request approvals when new commits are pushed | Yes |
| Require review from Code Owners | Optional (enable if CODEOWNERS file is added) |
| Require status checks to pass before merging | Yes |
| **Required status checks** | `lint`, `typecheck`, `test (18)`, `test (20)`, `test (22)`, `audit`, `gitleaks`, `build (18)`, `build (20)`, `build (22)` |
| Require branches to be up to date before merging | Yes |
| Require conversation resolution before merging | Yes |
| Require signed commits | Recommended |
| Require linear history | Recommended (squash-merge) |
| Include administrators | Yes |
| Allow force pushes | No |
| Allow deletions | No |

## Additional Repository Settings

| Setting | Location | Value |
|---------|----------|-------|
| Default branch | Settings → General | `main` |
| Allow merge commits | Settings → General → Pull Requests | No |
| Allow squash merging | Settings → General → Pull Requests | Yes |
| Allow rebase merging | Settings → General → Pull Requests | Optional |
| Automatically delete head branches | Settings → General → Pull Requests | Yes |

## Secrets Required

Add these in Settings → Secrets and variables → Actions:

| Secret | Purpose |
|--------|---------|
| `NPM_TOKEN` | npm publish token for `publish.yml` workflow |

> `GITHUB_TOKEN` is provided automatically by GitHub Actions.
