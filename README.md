# Anna's Chaos Crawl

A React and TypeScript game for hosted single-venue events and legacy pub crawls. Players join, complete challenges,
upload images or videos, vote, and follow live screens. The host manages rounds,
teams, submissions, and score awards. Vite builds the app for `/chaos-crawl/`;
client routes use hash fragments, such as `/chaos-crawl/#/admin`.

V2 uses `/join` (six-digit session code), `/play/:joinCode`, and the authenticated
`/host` routes. The cleaned-up legacy workflows remain available at `/legacy/join`,
`/game`, and `/admin-legacy`; both admin routes require a host login. Legacy players
and V2 session players use separate storage keys and backend contracts.

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

The legacy database schema, storage bucket setup, triggers, and access policies are
managed outside this repository. The application contracts are documented in
`src/types/database.ts`; they are inferred from existing queries, not generated
from or verified against the deployed schema. The app uses `players`, `teams`,
`pubs`, `challenges`, `side_challenges`, `game_state`, `challenge_completions`,
`photos`, `votes`, and `score_events`, plus the `photos` storage bucket and
Supabase Realtime.

V2 queries share the same lazy Supabase client and auth session through
`src/lib/sessionSupabase.ts`. Its dynamic schema boundary is separate from the
legacy `Database` contracts until types can be generated from the deployed V2
schema. V2 uses `host_games`, `host_favourites`, `cc_game_session_*` tables and
`cc_*` RPCs, plus `game-assets` and `session-evidence` storage buckets. Local
migrations are in `supabase/migrations`; merging code does not apply them.

## Error reporting

Create a React project in Sentry and set its public DSN as `VITE_SENTRY_DSN`
in `.env.local` or the deployment build environment, then rebuild and deploy.
Without a DSN, reporting is disabled. `VITE_SENTRY_ENVIRONMENT` defaults to the
Vite mode; set it to `production` for the live site. Optionally set
`VITE_SENTRY_RELEASE` to the deployed commit SHA or release version.

Sentry captures uncaught browser errors, unhandled promise rejections, React
rendering errors, and `console.error` calls. The shared API and legacy live-query
helpers also report failures handled by the UI. React crashes show a reload
button. Automatic collection of user identity, cookies, HTTP headers/bodies,
query values, and database query data is disabled. Error logs are also sent to
Sentry Logs. Tracing samples 100% in development and 10% in production; trace
headers are not propagated to Supabase. Session replay is not enabled.

The `chaos-crawl-frontend` Sentry project receives browser events. The separate
`chaos-crawl-functions` project is reserved for Supabase Edge Functions, whose
implementation currently lives outside this checkout. Instrumenting and deploying
those functions is deferred until their source is available.

For readable production stack traces, set `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and
`SENTRY_PROJECT` in the build environment (or `.env.local`). All three are
required to enable source-map uploads. The build uploads hidden source maps and
removes them from `dist` before publishing. Keep the auth token in CI secrets or
an ignored local file, never in a `VITE_` variable. Ordinary builds work without
these credentials.

To verify delivery, configure a DSN for a test project, run the app, and execute
`setTimeout(() => { throw new Error("Sentry verification"); }, 0)` in the browser
console. Confirm the event arrives in Sentry Issues with the expected environment
and release. Tests do not initialize Sentry or send events.

Setup follows the [Sentry React guide](https://docs.sentry.io/platforms/javascript/guides/react/)
and [Vite source-map guide](https://docs.sentry.io/platforms/javascript/guides/react/sourcemaps/uploading/vite/).

## Commands

| Command                                   | Purpose                                                              |
| ----------------------------------------- | -------------------------------------------------------------------- |
| `npm run dev`                             | Start the local development server                                   |
| `npm run build`                           | Check strict TypeScript contracts and build production assets        |
| `npm run preview`                         | Serve the production build locally                                   |
| `npm run lint`                            | Check TypeScript/JS, SCSS and formatting                             |
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

## Agent guidance and styling migration

[AGENTS.md](AGENTS.md) is the source of coding rules for this repository. Keep
strict TypeScript and preserve the current routes, Supabase contracts and visual
identity. [Refactor progress](docs/refactor-progress.md) records completed slices,
verification evidence, and remaining work.

New and migrated styles use project-owned SCSS in `scss/`, global BEM classes,
and shared design tokens. `src/main.tsx` imports `scss/style.scss` once after the
legacy globals. Existing CSS and Tailwind remain during the staged migration;
keep their import order and do not expand their usage. The shared Button, Card,
Input, DataError, Field, Toggle, Icon and Dialog now have SCSS blocks.

`npm run lint` runs Oxlint, Stylelint and formatting checks. Run `npm run lint:js`
or `npm run lint:scss` for an individual linter. `npm run review:load` reports the
review-relevant diff against `main`, including uncommitted and untracked source.
Above roughly 800 changed lines, supply a review map and distinguish mechanical
verification from behavior needing human review. New runtime dependencies still
require approval.

## Application boundaries

Open `/chaos-crawl/#/styleguide` for the component reference (no login required).
It includes live local demos, usage snippets, foundation colors and typography,
host CSS patterns, and a searchable catalog of every component module in
`src/components` and `src/features`. Connected features list their data and auth
dependencies. Demos use local state and do not read or write game data.
When adding or changing reusable UI, update the examples in
`src/pages/Styleguide.tsx` and integration notes in
`src/features/styleguide/catalog.ts`. New component modules appear in the catalog
automatically; previews reuse the production components and styles.

- `src/pages` composes routes. Admin tabs, game challenges, voting, slideshow
  playback, and submission review have focused components in `src/features`.
- The V2 host route keys its feature coordinator by session ID. Focused controllers
  own lobby, participation, roster, timer, rewards, final voting, secret reviews
  and moderation. Host polling lives in its read hook, and timer writes are queued.
- Host and participant persistence commands are typed services in `src/lib`.
  Shared session UI receives presentation data and callbacks, with no backend access.
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
suite covers legacy joining, session persistence, navigation and player visibility;
host journeys additionally require `SUPABASE_TEST_HOST_EMAIL` and
`SUPABASE_TEST_HOST_PASSWORD` for a host account in the disposable backend.
It does not validate V2 session RPCs or final/secret-mission voting.

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
