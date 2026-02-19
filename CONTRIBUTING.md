# Contributing

Thanks for your interest in contributing. This is a pnpm monorepo managed with Turborepo.

## Prerequisites

- [Node.js](https://nodejs.org/) (see `.nvmrc`)
- [pnpm](https://pnpm.io/)

## Setup

```bash
pnpm install
```

## Development

Run all apps in dev mode:

```bash
pnpm dev
```

Or target a specific app:

```bash
pnpm interface   # apps/interface only
```

## Code Style

We use [Biome](https://biomejs.dev/) for formatting and linting.

```bash
pnpm format      # auto-format
pnpm lint        # check for issues
```

Format is enforced via a pre-commit hook (husky). Make sure `pnpm install` has been run so hooks are registered.

## Commits

Commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) spec, enforced by commitlint.

```
feat: add treasury node inspection
fix: resolve subname creation for wrapped names
chore: update dependencies
```

Common types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`.

## Monorepo Structure

| Path | Description |
|---|---|
| `apps/interface` | Next.js web UI |
| `apps/docs` | Project docs (Vocs) |
| `apps/contracts` | Experimental contracts |
| `packages/schemas` | JSON schema toolchain |

Changes scoped to one package should not require touching others. If your change spans multiple packages, describe the dependency clearly in your PR.

## Pull Requests

- Keep PRs focused — one concern per PR
- Reference any related issues
- PRs require passing lint and build checks before merge
