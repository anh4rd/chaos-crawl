# Anna's Chaos Crawl

A React and TypeScript game for a pub crawl. Players join, complete challenges,
upload images or videos, vote, and follow live screens. The host manages rounds,
teams, submissions, and score awards. Vite builds the app for `/chaos-crawl/`;
client routes use hash fragments, such as `/chaos-crawl/#/admin`.

## Local setup

Use Node.js 22.12+ (or a newer supported LTS) and npm:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the project's public
Supabase connection values. The client validates them on first use and reports
connection errors in the UI. Never place a service-role key in a Vite variable.

The database schema, storage bucket setup, triggers, and access policies are
managed outside this repository. The application contracts are documented in
`src/types/database.ts`; they are inferred from existing queries, not generated
from or verified against the deployed schema. The app uses `players`, `teams`,
`pubs`, `challenges`, `side_challenges`, `game_state`, `challenge_completions`,
`photos`, `votes`, and `score_events`, plus the `photos` storage bucket and
Supabase Realtime.

## Commands

| Command                                   | Purpose                                                              |
| ----------------------------------------- | -------------------------------------------------------------------- |
| `npm run dev`                             | Start the local development server                                   |
| `npm run build`                           | Check strict TypeScript contracts and build production assets        |
| `npm run preview`                         | Serve the production build locally                                   |
| `npm run lint`                            | Check application and unit-test code with Oxlint                     |
| `npm test`                                | Run deterministic unit and component regression tests                |
| `npm run test:watch`                      | Run unit tests in watch mode                                         |
| `npm run format`                          | Format source, tests, configuration, and this document               |
| `npm run format:check`                    | Check formatting                                                     |
| `npm run test:e2e -- tests/smoke.spec.ts` | Test actual hash routes with a mocked backend                        |
| `npm run test:e2e`                        | Run deterministic desktop/mobile browser tests with a mocked backend |
| `npm run test:e2e:live`                   | Explicitly run live journeys against a disposable test backend       |
| `npm run test:e2e:ui`                     | Open Playwright's interactive test runner                            |
| `npm run test:e2e:headed`                 | Run browser tests in visible browsers                                |
| `npm run test:e2e:report`                 | Open the last browser test report                                    |
| `npm run deploy`                          | Build and publish `dist` to GitHub Pages                             |

Playwright starts Vite automatically. Install its browser once with
`npx playwright install chromium`. The default suite mocks database reads and
Realtime connections and never writes live data. `PLAYWRIGHT_PORT` can select
an unused local server port.

Live journeys are isolated under `tests/live` and require explicit
`SUPABASE_TEST_URL` and `SUPABASE_TEST_ANON_KEY` environment values for a
disposable backend, followed by `npm run test:e2e:live`. They start their own Vite
server using those values, rather than reusing a developer server. The backend
must contain the application's tables and `game_state` row with ID1. A per-test
fixture snapshots and seeds the shared screen flags, restores them after each
journey, and deletes only players named with that invocation's random UUID
prefix. Setup and cleanup failures fail the test. No live journeys are run by
`npm run test:e2e`, and no live backend is needed for local unit or default browser
regressions.

## Application boundaries

- `src/pages` composes routes. Admin tabs, game challenges, voting, slideshow
  playback, and submission review have focused components in `src/features`.
- `src/game/hooks` owns live reads and challenge participation. Read hooks expose
  `{ data, loading, error, reload }`, cancel superseded requests, and refresh from
  the database when Realtime changes arrive.
- `src/lib` owns persistence commands and pure score/vote projections. Commands
  return `{ data, error }`, including transport and configuration failures.

Score displays and host manual adjustments use the `score_events` ledger.
Personal events count for the player and their current team; direct team events
count only for that team. Historical `players.score` values are not added again.
Manual deductions cap against the current event snapshot; an atomic zero floor
for concurrent deductions requires server-side transaction support. Existing
backend triggers must be checked before rollout to avoid double-awarding.

Team votes store the canonical team ID. Result projections also accept an
unambiguous legacy team-name value, so older votes remain readable.

## Backend follow-up

The saved player ID is a lookup value, not an authentication credential. Host and
player write authorization must be enforced by Supabase policies or a trusted
server. Those policies cannot be verified or repaired without schema access.
Likewise, completion and vote uniqueness must be enforced in the database; the
client recognizes matching duplicate completions but cannot guarantee uniqueness
on its own. No database policies or migrations are applied by this repository's
local test suite.

Completion, award, leaderboard and vote behavior is covered by mocked regression
tests. Real database round trips for those core event workflows remain unverified
until a schema-compatible disposable backend is available. The explicit live
suite currently covers joining, session persistence, navigation and player visibility.

## Code health

Desloppify is installed in the ignored local `.venv` (Python 3.11+). Its working
state is ignored in `.desloppify/`. Continue the execution queue with:

```sh
.venv/bin/desloppify next
```

For a fresh environment, install with
`python3 -m pip install --upgrade 'desloppify[full]'`, then run
`desloppify scan --path .`. Exclude dependencies, generated build output, and
browser reports before scanning; keep source and tests in scope.
