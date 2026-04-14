# Contributing to @n11x/ghostnet-sdk

Thanks for your interest in contributing to GhostNet SDK! This document covers
the workflow and conventions we follow.

## Getting started

```bash
git clone https://github.com/n11x/ghostnet-sdk.git
cd ghostnet-sdk
npm install
npm run build
npm test
```

## Branch naming

Use the format `<type>/<short-description>`:

- `feat/bip39-identity` — new feature
- `fix/reconnect-loop` — bug fix
- `docs/api-reference` — documentation only
- `refactor/transport-cleanup` — internal changes
- `test/encryption-edge-cases` — tests only

## Commit style

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add BIP-39 seed phrase identity creation
fix: prevent reconnect after intentional disconnect
docs: update quickstart example
test: add encryption roundtrip tests
chore: bump vitest to 3.x
```

Breaking changes use `!` after the type: `feat!: change Identity type shape`.

## Pull requests

1. Branch off `main`.
2. Make your changes in small, focused commits.
3. Ensure CI passes: `npm run release` runs typecheck → lint → test → build.
4. Open a PR against `main` with a clear description of what and why.
5. One approval required before merge. Squash-merge preferred.

## RFC process for breaking changes

Breaking changes to the public API require an RFC before implementation:

1. Open a GitHub Issue titled `RFC: <description>`.
2. Describe the current behavior, proposed change, and migration path.
3. Allow at least 5 business days for discussion.
4. Once approved, implement and include a migration guide in the PR.

## Code standards

- Strict TypeScript — no `any`, no `@ts-ignore` without inline justification.
- Every public method needs a JSDoc block with an `@example`.
- Keep runtime dependencies to 5 or fewer. Justify new additions in the PR.
- No telemetry, analytics, or phone-home behavior. Privacy-first.

## Questions?

Open an issue or reach out to the maintainers.
