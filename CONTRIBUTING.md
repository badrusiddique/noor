# Contributing to Noor

Thank you for considering a contribution. Noor is a small, opinionated app — please read this document and the relevant ADRs before opening a substantial PR.

## Ground rules

- **Privacy is non-negotiable.** No analytics SDKs, no remote logging by default, no tracking. PRs adding any of those will be closed.
- **The 15-line Mushaf invariant is non-negotiable.** Mushaf mode never reflows. See ADR-0004.
- **SQLite is the source of truth.** Zustand stores cache the UI. See ADR-0005.
- **Per-component RTL.** Never `I18nManager.forceRTL`. See ADR-0006.

## Branching

Trunk-based. Short feature branches off `main`:

```
feat/<scope>-<short>
fix/<scope>-<short>
chore/<scope>-<short>
```

Scope must be one of: `mushaf, audio, data, search, nav, i18n, theme, qibla, settings, bookmarks, highlights, notes, share, db, ci, security, deps, docs, release`. Empty scope is allowed for cross-cutting changes.

Branches should live ≤3 days. If your branch is older, rebase or close.

## Commit grammar

[Conventional Commits](https://www.conventionalcommits.org/), enforced by `commitlint` via Husky. See [`commitlint.config.cjs`](commitlint.config.cjs).

```
<type>(<scope>): <subject>

<body>

<footer>
```

Allowed types: `feat, fix, chore, docs, refactor, perf, test, build, ci, revert, style`.

Examples:

```
feat(mushaf): add page-turn haptic feedback
fix(audio): handle CDN-1 timeout in resolveTrackUrl
chore(deps): bump expo to 52.0.10
docs(adr): add ADR-0011 for v1.1 cloud sync direction
feat(db)!: rename `verse_id` to `id` in `verses_fts`

BREAKING CHANGE: requires migration db/migrations/0002_rename_fts_id.sql
```

`!` after type signals a breaking schema change; the migration script must exist.

## Running locally

```sh
pnpm install
chmod +x .husky/*
pnpm start              # Expo dev server
pnpm ios                # iOS simulator
pnpm android            # Android emulator
pnpm test               # Jest
pnpm typecheck          # tsc --noEmit
pnpm lint               # ESLint
pnpm format:check       # Prettier check
```

For data-pipeline work (Phase 1+):

```sh
pnpm db:build           # builds assets/db/quran.db
pnpm db:verify          # golden-page checksums + FTS5 sanity
pnpm audio:bundle       # downloads + verifies bundled Al-Fatihah Alafasy
```

Both `db:build` and `audio:bundle` use the pinned URLs + SHA-256 hashes in `data/sources.json`. They cache to `data/cache/` (gitignored) and skip on cache hit.

## Pull request process

1. Branch off `main`. Keep the branch focused — one logical change per PR.
2. Run `pnpm lint && pnpm typecheck && pnpm test` locally before pushing.
3. Open a PR using the [PR template](.github/PULL_REQUEST_TEMPLATE.md). Fill in every section honestly.
4. CI must be green: typecheck, lint, format, jest, supply-chain (gitleaks, OSV, license scan, SBOM), expo-doctor, knip, madge, size-limit.
5. For changes touching `src/data/db/`, `db/migrations/`, or `scripts/`, expect extra scrutiny — these are high-blast-radius surfaces.
6. Squash merge. The squash commit message should be clean conventional-commit grammar (release-please reads it for the CHANGELOG).

## QA gate process

Every PR must run the relevant subset of [`docs/QA-MATRIX.md`](docs/QA-MATRIX.md) for the screens it touches. Tag PRs are gated on the full Stop-Ship subset for the phase. `v1.0.0` is gated on the entire matrix on every device.

If you can't run a row (e.g., you don't own a Pixel 4a), say so in the PR — the maintainer will run it before merging or before tagging.

## Signed commits — required from `v1.0.0` onward

After `v1.0.0` ships, all commits to `main` must be GPG/SSH-signed. Configure once:

```sh
git config --global commit.gpgsign true
git config --global tag.gpgsign true
```

Until `v1.0.0`, signed commits are recommended but not enforced.

## Testing expectations

- **Unit tests** for every reducer, query, and pure function in `src/data/queries/`, `src/state/`, `src/lib/`. Coverage threshold 70% (lines, branches, functions, statements).
- **Snapshot tests** for `src/features/mushaf/MushafPage.tsx` on pages 1, 300, 604.
- **Visual regression** via `jest-image-snapshot` for the Mushaf page renderer (5 pages × 2 themes).
- **A11y tests** via `@axe-core/react-native` — zero violations.
- **E2E flows** via Maestro for the golden user paths in `.maestro/`.

## File layout

See [`README.md`](README.md) and the directory structure in the original implementation plan. Notable conventions:

- Routes live in `app/`, code lives in `src/`.
- Path aliases: `@/` → `src/`, `@app/` → `app/`, `@assets/` → `assets/`.
- Feature folders (`src/features/<name>/`) own their UI, hooks, and feature-specific types.
- Cross-feature state lives in `src/state/`.
- DB queries live in `src/data/queries/`.

## Reporting bugs

Use the [bug template](.github/ISSUE_TEMPLATE/bug.yml). Include device, OS version, app version, and reproduction steps.

## Reporting security issues

**Do not file a public issue.** Email `badru.siddique@hudl.com`. See [SECURITY.md](SECURITY.md) for scope.
