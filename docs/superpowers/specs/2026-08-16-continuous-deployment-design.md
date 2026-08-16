# Continuous Deployment Design

## Goal

Every merge to `main` must deploy forward-only Supabase migrations and the
static VHSBOARD frontend to the project's free `*.pages.dev` address. The
existing `vhsboard.pl` WordPress deployment remains untouched.

## Architecture

Two GitHub Actions workflows make GitHub Actions the only deployment
mechanism. The pull-request workflow performs unprivileged application checks.
The production workflow repeats those checks on the merge commit, then deploys
Supabase migrations before publishing only `.output/public` to Cloudflare
Pages.

All production jobs run only when `github.ref == 'refs/heads/main'` and share
the `production-deploy` concurrency group without cancellation. That serializes
migrations and Pages deploys. The Supabase secrets and Cloudflare credentials
are exposed only through GitHub's `production` environment; public Vite values
come from repository or organization variables.

## Workflows

### Pull-request verification

`.github/workflows/verify.yml` runs on pull requests targeting `main`. It has
three independent jobs named `test`, `lint`, and `build`. Each checks out the
PR revision, installs Bun, runs `bun install --frozen-lockfile`, and invokes
exactly its corresponding script. The workflow grants only `contents: read`,
does not use `production`, and does not reference secrets.

### Production deployment

`.github/workflows/deploy-pages.yml` runs after pushes to `main` and may be
started manually. Every job has the explicit main-branch guard, so a manual
dispatch from another ref is a no-op.

`verify` rebuilds and checks the merged SHA using only `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`, and `VITE_SITE_URL` from `vars`; no environment dump
is permitted. `deploy-supabase` needs `verify`, binds to `production`, links
the project using the three Supabase environment secrets, and executes exactly
`supabase db push --dry-run` followed by `supabase db push`. It never runs a
seed, migration repair, or rollback.

`deploy-cloudflare` needs `deploy-supabase`, repeats checkout, dependency
installation, and the production build. The pinned Wrangler action runs `pages
deploy .output/public` for `vars.CLOUDFLARE_PAGES_PROJECT` and the `main`
branch. Its deploy step is `id: pages_deploy`; a subsequent root-path health
check accepts only an HTTPS `*.pages.dev` deployment URL. The step receives
only the Cloudflare token, account ID, and GitHub token, never a Supabase
secret. The server bundle is not published.

All external actions are pinned to these verified immutable commits, with their
release versions in comments:

- `actions/checkout`: `11bd71901bbe5b1630ceea73d27597364c9af683` (`v4.2.2`)
- `oven-sh/setup-bun`: `0c5077e51419868618aeaa5fe8019c62421857d6` (`v2.2.0`)
- `supabase/setup-cli`: `3c2f5e2ae34c34e428e8e206e2c4d21fa2d20fbf` (`v2.1.1`)
- `cloudflare/wrangler-action`: `ebbaa1584979971c8614a24965b4405ff95890e0` (`v4.0.0`)

## Documentation and operations

`docs/deployment-runbook.md` will specify the required GitHub `production`
environment secrets and public variables, the Cloudflare Direct Upload setup,
and routine diagnostics. It will include the first-merge verification order,
Pages URL check, branch-protection checks to add after success, and an explicit
statement that custom domains and `vhsboard.pl` changes are out of scope.

`README.md` will link to that runbook and describe the deployment boundary at a
high level without reproducing credentials.

## Validation

The implementation will be reviewed statically for job dependencies,
permissions, environment boundaries, branch guards, action SHA pins, and the
Pages-only health check. The repository's `bun run test`, `bun run lint`, and
`bun run build` will run locally. Live deployment verification remains a
manual GitHub/Cloudflare/Supabase operation because no production credentials
are present in this workspace.

## Scope exclusions

This change introduces no `wrangler.toml`, Workers, Pages Functions, D1, KV,
R2, custom domain, Git integration, reservation feature, or backend service.
