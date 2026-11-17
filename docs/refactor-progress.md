# Chaos Crawl refactor progress

This is a staged migration, not a completed whole-app rewrite. The root
[AGENTS.md](../AGENTS.md) defines the target rules and temporary exceptions.
No deployment, database migration, policy changes, or live backend writes are
included.

## Delivered slices

| Slice                 | Changes                                                                                                                                                                                                          | Review focus                                                            |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Guidance and gates    | Project-specific AGENTS.md; Sass, Stylelint, formatting gate and review-load command; pinned mocked backend for browser tests                                                                                    | Rules, dependency changes and migration boundaries                      |
| Shared UI             | Button, Card, Input, DataError, Field and Toggle now use tokenized SCSS; semantic Icon module controls Lucide glyphs and SCSS dimensions                                                                         | Utility-layer coexistence and caller class overrides                    |
| Component ownership   | Separate session profile/titlebar; extracted host planning sections, live-host panels, session-player galleries/reviews, legacy status/leaderboard cards and styleguide sections                                 | Props and preserved conditional rendering                               |
| External concerns     | Session-player timer lifecycle and host session data load moved to focused hooks; planning data/types and pure date helpers separated                                                                            | Timer cleanup, stale responses, polling and unchanged backend contracts |
| Accessibility changes | Native game-inspector dialog with focus cycling, Escape and focus restoration; pressed-state saved filters; keyboard focus ring and description for Toggle; planning dock positioned above the mobile navigation | These are intentional behavior changes, separate from extraction parity |
| Cleanup               | Removed the unused HostSetupBuilder.css predecessor already consolidated into HostPlanning.css                                                                                                                   | No source imports referenced it; the consolidated stylesheet remains    |

The current diff substantially exceeds the approximate 800-line review budget.
Review guidance/tooling first, shared UI second, component extraction third, and
accessibility changes separately. Most moved JSX is mechanical; hook boundaries,
stylesheet ordering, utility overrides, and dialog behavior deserve scrutiny.
Use `npm run review:load` for current numbers, including untracked source.

## Verification evidence

Initial baseline: 31 test files, 259 passing tests, 10 hook-dependency warnings,
and passing formatting. Final checks for this tranche: **262 unit/component tests
and 48 desktop/mobile browser checks pass**; lint, formatting, strict TypeScript,
Playwright type checks and production build pass. Oxlint reports 56 warnings,
including the pre-existing hook warnings and newly exposed accessibility debt.
Build verification disabled Sentry uploads. Three timer regression tests now cover stable snapshots,
out-of-order responses, subscription/interval cleanup and recovery after errors.

Deterministic browser fixtures intercept auth, REST, RPC and Realtime; they reject
unexpected backend operations. Public Supabase test values are pinned in the
Playwright server configuration, and server reuse is disabled so an existing
server cannot accidentally supply a developer's backend settings. Live tests
remain opt-in and separate.

Before/after browser comparisons used an untouched temporary copy of the starting
commit, the same mocked data, fixed date, blocked remote fonts, and desktop/mobile
viewports. Initial Button/Card/Input screenshots matched pixel-for-pixel. Their
computed-style differences were only removed invisible Tailwind shadow layers
and unused gradient transition properties. Expanded CSS comparison matched all 18 migrated Field/Toggle selectors and their ordered
declarations after accounting for class renames, equivalent time/color notation,
and the separately added keyboard focus rule. Host hub and initial planning DOM and
computed styles matched. Player game, scores and side-challenges matched after
restoring the original GuidedTour stylesheet import order. Lobby differences were
the different localhost ports in the invite URL and its derived QR path. A subsequent mobile-device check reproduced the planning dock hidden behind the
fixed navigation in the original app; a separate route-shell fix lifts the dock
above the navigation and safe-area inset. This intentional layout correction is
covered by the mobile save/error journeys. These
checks do not prove every round, upload, voting or secret-mission state.

The environment needs locally extracted Chromium libraries through
`LD_LIBRARY_PATH=/tmp/sentry-browser-libs/extracted/usr/lib/x86_64-linux-gnu`.
During development an external test-server configuration was used to bypass a
slow availability probe on unused localhost ports. The committed Playwright
configuration still owns its test server and test environment.

Oxlint now enforces 27 core semantic/keyboard accessibility rules as errors.
Additional plugin warnings expose existing label, media-caption and semantic-tag
work; they are not proof of full accessibility compliance. Native draggable rows
retain independent move-up/down buttons; the interaction rule checks click,
keyboard and mouse activation handlers rather than drag lifecycle events.

## Remaining work recorded after phase 1

1. Add controlled V2 states and regressions for host round progression, timer
   writes, team assignment, evidence uploads, rewards, final voting and secret
   reviews. Current fixtures primarily cover navigation, lobby, planning
   save/launch, recovery and error paths.
2. Continue decomposing the large host-live and session-player orchestration;
   persistence commands still remain in those route components. Refine the large
   reward/final panels as their workflows gain regression coverage.
3. Convert host, player, planning and remaining route CSS into owned SCSS blocks
   and small route shells. Tokenize existing values without changing them, remove
   borrowed classes and consolidate repeated UI. Preserve import/cascade order;
   do not move all styles to the root blindly.
4. Finish legacy utility-to-BEM migration. Tailwind and its Vite plugin remain
   necessary until their final consumers are converted; do not remove them early.
5. Resolve the remaining accessibility findings in explicitly tested slices,
   broaden visual/state comparisons, then remove the migration exceptions from
   AGENTS.md and README.

A frontend refactor cannot establish deployed policy correctness, atomic scoring,
or schema compatibility using mocked tests. Those claims still require a
schema-compatible disposable backend, as documented in README.

## Phase 2: shared V2 host/player session experience

The V2 routes now compose `SessionPage`: one profile/title/content/navigation base
with toolbar, feedback and overlay slots. This phase intentionally unifies common
host/player appearance using the existing purple/pink/lime tokens. It is not a
pixel-neutral stylesheet move. Role-specific management controls remain separate.
Legacy gameplay and host planning are outside this phase.

The participant route adapts parameters to `SessionParticipant`, which the host
route also embeds after explicit participation. The host-specific player token
is supplied directly; an ordinary saved player token is never substituted. Host
uploads, submissions, reward votes, final votes and secret-review votes stay
inline, with host navigation available. Nonparticipating hosts see shared content
without participant actions and can explicitly join.

Shared presentation components cover main/side/secret challenge furniture,
submission/evidence controls, state/feedback panels, scores and team rows, reward
candidates/results, final voting and secret review. Feature adapters map database
contracts into presentation models. Private mission acknowledgement/dismissal,
team selection and host management retain their feature rules. `useSessionPlayerData`
owns participant reads and polling; `sessionEvidence` owns upload validation and
persistence. Obsolete reads are ignored on navigation, credential change and
unmount. Secret review takes precedence over rewards and normal game content.
Result counts, winner badges and voter identities are hidden during open voting.

The styleguide includes a local role/phase preview and shared component catalog
notes. It performs no backend requests. A section variant previews the shared
page without introducing a nested main landmark or a second fixed viewport dock.

### Review map

This phase substantially exceeds the approximately 800-line review budget. Review
these as separate slices; the prior phase remains in the same uncommitted worktree.

| Slice                               | Purpose                                   | Mechanical work                                                                              | Scrutiny and proof                                                                                                                          |
| ----------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared presentation and SCSS        | One base and common widgets               | Existing theme values promoted into tokens; common markup consolidated                       | Intentional visual unification. Browser DOM/computed-style comparison across roles and desktop/mobile screenshots; review responsive layout |
| Participant controller and adapters | Reuse participation inside host route     | Existing participant workflow moved from the route; backend-to-presentation mappings         | Host token isolation, phase precedence, navigation and read-only capabilities; mocked upload/vote payload regressions                       |
| Queries and evidence service        | Isolate external concerns                 | Existing polling, file validation, storage path and registration payload extracted           | Stale reads, cleanup and failure handling; unit regressions for credential changes, unmount, validation and partial upload failure          |
| Host composition                    | Keep management alongside shared gameplay | Removed duplicate public scores/reward/final/review UI; legacy management retains scoped CSS | Explicit join, inline participation, host controls reachable during takeovers; browser journeys                                             |
| Styleguide and guidance             | Keep the new contract discoverable        | Catalog notes and local preview                                                              | Preview role/phase switches; no backend access; AGENTS layer guidance                                                                       |

The exact pre-phase snapshots used for delta accounting are temporary development
artifacts. `npm run review:load` reports the cumulative diff against main and thus
includes the earlier phase. Review ordinary frontend behavior using deterministic
fixtures; deployed Supabase policy/schema correctness remains outside this proof.

### Phase 2 verification

- 272 unit/component tests across 36 files pass. New regressions cover evidence
  validation and storage/registration failures, stale credentials and polling
  cleanup, private mission final locks, role navigation and hidden voting results.
- 72 mocked browser checks pass across desktop Chromium and Pixel 7. Cases cover
  inline host upload/submit/reward/final/secret voting credentials, read-only host
  views, tied winners, matching team totals, review error feedback, keyboard access
  to host controls, recovery, break/completion states and the local styleguide.
- Shared main-challenge heading DOM and computed typography, colors, border,
  padding and widths match between host/player at both viewports. Desktop/mobile
  screenshots were captured and visually inspected; this proves the shared base,
  not pixel parity with the intentionally different pre-phase layouts.
- Lint, formatting, application and Playwright TypeScript checks, production
  build and whitespace checks pass. Oxlint reports 48 remaining warnings, with
  no errors. No dependencies were added in this phase. Browser verification used
  only the isolated fixture server; build verification disabled Sentry uploads.
- Phase-specific delta: 69 files, +5,547 / -3,788 lines. This compares the captured pre-phase
  worktree with the current tree, discounting blank lines and indentation.
- Cumulative `npm run review:load` against main: 152 files, +12,270 / -9,561 lines (21,831 total). This includes the
  prior uncommitted phase and discounts whitespace, pure renames, lockfiles and
  generated output. Use the review map above to split human review.
