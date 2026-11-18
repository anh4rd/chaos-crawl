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

## Phase 3: host management and persistence boundaries

Baseline: local commit `151c8ad`. The host route now keys its feature coordinator
by session ID. Management panels and the six lobby steps have their own files;
focused controllers own participation, roster forms, rewards, final voting,
secret assignment/review, moderation and challenge editing. Participant team,
voting, submission and private-mission concerns also have focused controllers.
Existing shared session presentation and legacy host/player classes remain intact.

Named typed services own persistence through `runApi`, including transport
failure normalization. Prompts, notices and credentials remain in controllers.
Pure feature models own rankings, evidence selection and review projections.
Host reads own one polling lifecycle; the timer owns ticking, five-second
publishing and serialized writes. Slideshow connections close and detach listeners
on unmount/session changes, including connections that resolve late.

Behavioral corrections are separate from the mechanical panel moves: synchronous
host operation locking, rejection of obsolete reads, identity-based remounting,
connection listener cleanup and persistent command errors. Query refreshes no
longer erase failed command feedback. The avatar failure journey proves that a
successful host join survives a failed photo upload and that its error remains
visible through a subsequent poll. Avatar preview URLs are revoked on cleanup.

### Phase 3 review map

This extraction exceeds the approximate 800-line review budget. Review in these
slices; no deployment or backend migration is included.

| Slice                                        | Mechanical work                                                               | Scrutiny and evidence                                                               |
| -------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Persistence services                         | Existing payloads, filters and storage options moved into named functions     | Exact protocol tests; transport/storage/database failure normalization              |
| Management and lobby panels                  | JSX moved into feature components, with existing classes and stylesheet order | Baseline/current desktop/mobile element, text and computed-style comparisons        |
| Participant controllers                      | Team, voting, submission and mission logic extracted from composition         | Existing standalone/inline host journeys and private-mission regressions            |
| Timers, queries and presentation connections | External concerns given explicit owners                                       | Timer sequencing/cleanup, stale responses, session capture, late connection cleanup |
| Operation and feedback coordination          | Shared host lock and separate command/query feedback                          | Synchronous conflict test; failures preserve usable controls and survive refresh    |

### Phase 3 verification

- Unit/component suite: 292 passing tests across 43 files.
- Isolated browser suite: 86 passing desktop/mobile checks.
- All 24 sampled desktop/mobile panels match in element structure, text and
  computed styles. The comparison coalesces adjacent React text nodes whose
  segmentation changes when JSX is formatted, without changing their text.
  Twenty-three screenshot pairs are byte-identical; one desktop reward-panel
  image has a small raster difference despite matching layout/style snapshots.
- Lint, formatting, application and Playwright TypeScript checks, production
  build and whitespace checks: all pass; 48 existing Oxlint warnings and no errors.
- Review load against the committed phase-2 baseline: 66 files, +9,032 / -5,544 lines (14,576 total).

## Phase 4a — invitation, guided tour and shared presentation patterns

The public invitation now composes shared poster cards, headings, brand links,
badges, instruction steps and button/link variants. Feature components own the
hero, preparation, rules and optional pre-event task. Its public RPC, code
cleaning, optional sections and join navigation retain their existing contracts;
the read lifecycle lives in `useInvitationData`.

Guided-tour styling now uses owned BEM blocks and exact-value tokens. Runtime
positioning reads its gap, edge and preferred width from token-backed CSS custom
properties instead of duplicating design dimensions in JavaScript. The demo
notice is a shared component with a local styleguide example.

Repeated styleguide patterns now use `Note`, `ControlRow`, `TimerDisplay`,
`EmptyState` and the text button variant. Compact notes explicitly own the
typography and margins previously supplied by catalog paragraph overrides.
Shared components remain presentation-only, and the catalog documents their
contracts. The remaining styleguide shell and examples still use transitional
CSS; this is the first styling slice, not the end of the styling migration.

### Phase 4a verification

- Unit/component suite: 295 passing tests across 44 files. New invitation
  regressions cover cleaned codes, unavailable/closed invitations and obsolete
  responses after a code change.
- Isolated browser suite: 92 passing desktop/mobile checks, including full,
  unavailable and optional-section invitation journeys and existing host/player
  workflows. The styleguide keyboard and focus-return journeys pass.
- Compiled CSS comparisons preserve declarations in 29 guided-tour and 36
  invitation selector/media projections, plus six shared reference-pattern
  projections. Four unused tour selector families and unused invitation modal
  styles were removed. Shared Card/Button variants reset inherited defaults to
  preserve the existing poster appearance.
- Ten product scenario pairs (full/minimal/unavailable invitation and two demo
  tour steps, desktop/mobile) have matching normalized DOM and computed styles
  and byte-identical screenshots. The two styleguide-tour popup comparisons
  differ only in vertical placement by less than 0.6px because added examples
  change native scroll centering; all other sampled properties match.
- Fourteen shared reference previews have matching normalized DOM/computed
  styles and byte-identical screenshots with a common capture position and
  backdrop. Normalizing that capture avoids unrelated page content behind
  transparent previews and differences in scroll rasterization.
- Lint, formatting, application and Playwright TypeScript checks, production
  build and whitespace checks pass. Oxlint retains 48 warnings and no errors.
  No dependencies were added. Browsers used isolated fixtures; Sentry uploads
  were disabled for the verification build.

### Phase 4a review map

The cumulative uncommitted changes include Phase 3 and exceed the approximate
800-line review budget. Keep the management-controller review map above separate
from these styling slices:

| Slice                          | Mechanical work                                                              | Scrutiny and evidence                                                               |
| ------------------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Tour and demo notice           | Class ownership, exact-value tokens and CSS geometry inputs                  | Compiled projections; two demo steps at both viewports; runtime positioning         |
| Invitation feature composition | Existing public data flow and optional content moved into focused components | RPC/code/error regressions; navigation and conditional-content browser checks       |
| Shared poster UI               | Existing invitation shapes promoted into generic UI and SCSS                 | Variant defaults, semantic elements and cascade resets; product pixel comparisons   |
| Shared reference patterns      | Repeated note/control/timer/empty markup replaced with shared components     | Compact catalog notes and text-button resets; fourteen isolated preview comparisons |

## Phase 4b — styleguide layers and examples

The styleguide route is now a 74-line composition. Focused examples own their
local button, clipboard, challenge and host-action state; only the name shared
between input and profile examples stays in the route. The shell, reference
sidebar, introduction, palette, type samples, example containers and catalog
have owned BEM blocks. The route partial contains shell layout and scoped page
defaults; component declarations live in component partials.

`Styleguide.css` is removed. Existing colors, dimensions and typography have
exact-value tokens. A small recurring label fragment serves `Overline` and the
reference sidebar. Shared Badge gains outline/subtle variants, BrandLink gains
its existing compact icon treatment, and their contract notes/examples are
updated. Swatches use explicit token classes and read the displayed value from
the actual CSS variable, removing inline styles and a duplicate hex catalog.
The Card example's remaining utility classes have also moved into owned SCSS.

### Phase 4b verification and review map

- Unit/component suite: 295 passing tests across 44 files.
- All 92 isolated desktop/mobile browser checks pass. Following the final
  preview-only cascade correction, all six targeted styleguide interaction,
  keyboard/focus and role/phase checks pass again.
- All 104 used selector/media declaration projections match after normalizing
  equivalent color serialization. Five stale player-preview rules with no
  consumers were removed.
- All 30 sampled desktop/mobile views have matching normalized DOM and computed
  styles, with byte-identical isolated screenshots. Samples include the shell,
  sidebar, introduction, foundations, primitive examples, expanded usage code,
  session profile/challenge, feedback, host actions, catalog and empty results.
  Normalization covers intentional BEM/shared-class changes, removal of inline
  swatch styles, adjacent text-node segmentation and the catalog count increasing
  for the new shared component. Screenshots use a common position/backdrop and
  count text. Normal viewport captures were inspected; neither viewport has
  horizontal page overflow.
- Lint, formatting, app/Playwright TypeScript checks, production build and
  whitespace checks pass. There remain 48 Oxlint warnings, with no errors.
  Verification used isolated backend fixtures and disabled Sentry uploads.

This slice exceeds the approximate 800-line review budget. The cumulative diff
also contains the independently described earlier phases.

| Slice                        | Mechanical work                                                           | Scrutiny and evidence                                                                              |
| ---------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Route and local examples     | Existing JSX/state moved into focused components                          | Name-to-profile coordination, clipboard and demo actions; browser interaction suite                |
| Owned SCSS blocks            | Existing declarations/classes promoted into tokens and BEM partials       | Cascade and responsive layout; 104 compiled declaration projections and 30 rendered comparisons    |
| Shared variants and palette  | Existing labels/badges/brand treatment promoted; swatches read CSS tokens | Variant resets and displayed token values; catalog contracts, palette and shell comparisons        |
| Legacy host preview boundary | Preview reset explicitly outranks route-loaded legacy host styles         | Host preview height/background at desktop/mobile; scoped selectors avoid affecting real host pages |

## Phase 4c — host authentication and shared wordmark

The login route now composes `HostAccess`, a focused auth hook and a controlled
form. Named SDK functions in `lib/hostAuth.ts` preserve the existing session,
password-login and signup calls, including trimmed email/display-name values,
metadata, confirmation feedback and redirects. The typed auth API uses the
existing shared Supabase client; no separate authentication stack was added.

The host header and login now use the same `BrandLink` host variant, including
their existing glyph sizes. `InputIcon` owns the leading input icon. Both shared
components have local styleguide examples and catalog notes. Auth shell/form,
input-icon and wordmark styling moved from HostPortal.css into owned SCSS with
exact-value tokens. Superseded wordmark declaration sets and its ineffective
early 560px rule were removed. Native form controls and the remaining shell
styles still use their transitional host styles; those are the next slice.

The migration preserves existing auth behavior. Mode-control semantics and
broader lifecycle/accessibility findings remain assigned to the explicit final
accessibility/lifecycle pass rather than being silently changed during extraction.

### Phase 4c verification and review map

- Unit/component suite: 301 passing tests across 45 files. Six new auth
  regressions cover login payloads/redirects, failed login and mode recovery,
  signup metadata/confirmation, session-bearing signup, existing sessions and
  rejection of a late session-check redirect while the router stays mounted.
- Full isolated desktop/mobile browser suite: 100 passing checks, including
  eight new auth checks. Following the final CSS compatibility fixes, all
  fourteen affected auth/styleguide checks pass again.
- Twenty-one effective selector/media declaration projections match after
  consolidating overridden wordmark values and removing its dead early 560px
  override. Shared wordmark defaults are reset explicitly. Temporary scoped
  rules prevent the remaining route-loaded host reset/field styles from
  overriding mode-button typography and input-icon padding.
- Fifteen before/after view pairs have matching normalized DOM and computed
  styles and byte-identical screenshots: login, signup, failure, confirmation
  and pending requests at desktop/mobile sizes, plus host headers at 393, 640,
  900, 1280 and 1600 pixels. Normalization covers intentional BEM/shared classes
  and adjacent text-node segmentation; layouts and form states remain intact.
- Lint, formatting, application and Playwright TypeScript checks, production
  build and whitespace checks pass. Oxlint retains 48 warnings and no errors.
  No dependencies were added. Browser/backend operations were isolated fixtures;
  verification builds disabled Sentry uploads.

This slice and the cumulative diff exceed the approximate 800-line review
budget. Review the auth extraction independently from the prior controller and
styling slices.

| Slice                          | Mechanical work                                                      | Scrutiny and evidence                                                                                   |
| ------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Auth route/form/hook           | Existing state, form markup and SDK calls given explicit owners      | Payloads, confirmation and redirect behavior; unit and mocked browser regressions                       |
| Shared wordmark and input icon | Existing header/login markup consolidated with preserved glyph sizes | Native link props, decoration and responsive wordmark rules; fifteen rendered comparisons               |
| Owned auth SCSS                | Existing values promoted to tokens; obsolete overrides removed       | Legacy-reset specificity and field inset compatibility; effective compiled declarations and screenshots |
| Contracts and local examples   | Guidance/catalog updated; presentation-only examples added           | Styleguide flows and examples run without live backend access                                           |

## Phase 4d — host workspace and presentation boundaries

Host routes now compose a connected `HostWorkspace`. Its focused identity hook
preserves the existing user lookup, preview identity/home link, sign-out call and
navigation behavior through named SDK functions. `HostShell` is presentation-only
and receives identity and callbacks. Its header and two navigation variants have
separate component owners. The shell retains its content/sidebar/context slots;
embedded examples can select a div instead of introducing a nested main landmark.

Account chips, initial avatars, loading screens and spinners are shared UI.
Their styles and the host palette/reset moved into owned SCSS partials; root
defaults load before component declarations. A narrow compatibility rule
preserves the existing disabled opacity in planning navigation while its legacy
stylesheet still loads later. Shell/navigation and other control styles remain
transitional CSS and are the next migration work.

The local shell preview demonstrates callbacks, read-only capabilities, account
identity, navigation and loading without authentication reads. Native output
semantics avoid adding a new status-role warning; Note keeps paragraph semantics
by default. The reference wrapper adapts the embedded mobile header spacing and
contains its fixed navigation without changing product layouts.

### Phase 4d verification and review map

- Unit/component suite: 304 passing tests across 46 files. New regressions prove
  the shell performs no identity query, delegates actions, preserves connected
  identity/sign-out navigation, and retains read-only preview links/capabilities.
- Full isolated desktop/mobile suite: 102 passing checks. A new browser case
  exercises local shell actions and read-only mode, verifies one main landmark
  and asserts zero backend requests. Affected planning/reference journeys were
  rerun after the compatibility and reference-only changes.
- Sixteen effective selector/media projections and spinner keyframes match.
  The additional planning-specific compatibility rule preserves the former
  cascade; inherited form fonts and scoped palette values remain unchanged.
- Twenty-three sampled product view pairs have matching normalized DOM and
  computed styles: host hub, planning, saved, read-only preview, pending session,
  three further responsive header sizes, and ten authentication states/views.
  Twenty-two screenshot pairs are byte-identical. The mobile read-only preview
  differs at four raster pixels while its sampled DOM/styles match. Loading
  comparisons pause both CSS animations and set their time to 200ms before
  capture. Normalization covers deliberate class renames, the shell marker and
  adjacent React text-node segmentation.
- Lint, formatting, application/Playwright TypeScript checks, production build
  and whitespace checks pass. Oxlint remains at 48 warnings, with no errors.
  No dependencies were added; fixture browsers and Sentry-disabled builds kept
  verification isolated from live services.

The cumulative diff exceeds the approximate 800-line review budget. Review this
slice independently from the preceding auth, controller and styling changes.

| Slice                                | Mechanical work                                                                 | Scrutiny and evidence                                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Connected workspace                  | Existing user lookup, preview derivation and navigation moved to a focused hook | Shared SDK identity and sign-out behavior; unit and route browser regressions                                            |
| Presentation shell/header/navigation | Existing JSX split; identity/actions supplied as props                          | Read-only controls, sidebar/context slots, native landmarks; rendered product comparisons and backend-free local preview |
| Account/loading UI and host defaults | Existing declarations promoted into tokens and owned blocks                     | Cascade, disabled planning state, chip visibility and animation; compiled projections and fixed-time screenshots         |
| Reference contracts                  | Local interactive/read-only examples and native output feedback                 | No backend requests, local callback results and one main landmark; desktop/mobile browser checks                         |

## Phase 4e — owned host shell and navigation styling

The shell's layout/content/context/mascot elements and the header's actions/help
now have owned BEM classes. Top and mobile navigation have their own blocks.
Their styles moved from HostPortal.css and HostTheme.css into four component
partials. Remaining feature-specific legacy selectors were updated to reference
those owners without changing their conditions or specificity.

The migration replaces 97 distributed rules with their effective declarations,
removing 71 superseded declarations. Existing colors, gradients, breakpoint
boundaries, z-index values and dimensions now use project tokens. Sidebar,
heading and action-control furniture remain separate migration work; the shell
does not acquire their declaration sets.

The shell/header/navigation accept an optional local navigation callback.
Normal application links retain router behavior. The reference preview supplies
the callback so exercising its top/mobile links or wordmark stays on the
styleguide and does not mount a connected workspace. This reference-only behavior
correction is separate from the mechanical CSS/class moves.

### Phase 4e verification and review map

- Unit/component suite: 304 passing tests across 46 files.
- The full 102-case isolated desktop/mobile browser suite passes, including the
  extended preview case that clicks its navigation/wordmark and verifies zero
  backend requests. Two added desktop/mobile application-navigation checks pass
  separately, covering saved/games routes and active-link semantics: 104 current
  browser cases verified in total, with unchanged application source between runs.
- Twenty-eight compiled selector projections match across 33 viewport samples,
  including both sides of every migrated breakpoint. Comparison uses the full
  original declaration sequence to account for the removed superseded values.
- Thirteen rendered view pairs match in normalized DOM, element bounds, sampled
  typography and every migrated CSS property, with byte-identical screenshots.
  Samples cover hub, games, planning, saved and read-only views on desktop/mobile,
  plus headers at 640, 900 and 1600 pixels. Normalization covers deliberate class
  renames and adjacent React text-node segmentation; image decoding completes
  before capture.
- Lint, formatting, app/Playwright TypeScript checks, production build and
  whitespace checks pass. Oxlint remains at 48 warnings and no errors. No
  dependencies were added; fixture browsers and Sentry-disabled builds kept
  verification isolated from live services.

This slice and the cumulative diff exceed the approximate 800-line review budget.
Review the CSS ownership separately from the local navigation callback behavior.

| Slice                                   | Mechanical work                                             | Scrutiny and evidence                                                                                                             |
| --------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Shell and header ownership              | Existing selectors/classes moved to BEM component partials  | Grid/slot placement, fixed mascot and responsive header; compiled projections and rendered bounds/screenshots                     |
| Navigation ownership                    | Existing link styles and active-state specificity preserved | Active routes and responsive visibility; saved/games routing checks and rendered comparisons                                      |
| Design tokens and obsolete declarations | Existing values promoted; superseded values removed         | Breakpoint-edge projections across 33 viewport samples; all thirteen screenshot pairs identical                                   |
| Local preview navigation                | Optional callback intercepts links only when supplied       | Header/mobile/wordmark clicks remain on the reference with zero backend requests; default application routing verified separately |

## Phase 4f — shared controls and page furniture

Fifty application button/link sites now compose shared Button comic variants or
ButtonLink, and both icon actions use labeled IconButton. ButtonLink supports a
native href as well as router navigation, preserving the invite's target and rel.
The host auth form composes Field with its comic variant. HostShell composes
PageHeading and WorkspaceSidebar with the same DOM structure and slot behavior.

Active styles moved from the legacy portal/theme/planning/hub files into owned
SCSS partials. The migration covers 79 source rules, removes 70 superseded
declarations and removes 41 unreachable sidebar/form/navigation selector rules.
The application root modifier is now host-portal--app. Existing global cc custom
property names remain available, defined through tokens in the global layer.
Feature-specific skins remain transitional consumers until their subsystem moves.

The styleguide demonstrates comic tones, disabled actions, a local native link,
accessible icon actions, comic fields and a toggled workspace sidebar. The demos
use local state; the connected workspace remains outside the reference.

### Phase 4f verification and review map

- Unit/component suite: 304 passing tests across 46 files.
- Forty-eight compiled selector projections match across twenty viewport samples,
  covering both sides of migrated breakpoints. The comparison preserves every
  original declaration and separately accounts for resets needed to neutralize
  the shared Button/Field base styles. Runtime DOM/style comparisons verify those
  resets rather than treating their addition as proof of parity.
- Twenty-seven rendered view pairs match in normalized DOM, sampled computed
  styles and byte-identical screenshots: thirteen workspace/header views, ten
  auth states, and four live/populated-saved views. Workspace/live/saved pairs
  also compare element bounds. Normalization covers class renames, added shared
  base classes, React text segmentation and the local fixture port.
- All 104 existing isolated desktop/mobile browser cases pass. Two added cases
  also pass, verifying native link semantics, keyboard actions and the local
  sidebar toggle with zero backend requests: 106 current browser cases verified.
- Two additional visible host-management pairs match in DOM, bounds, computed
  styles and screenshots after masking only the QR matrix. Its encoded local
  server port differs between the fixture apps; the link href/target/rel remain
  part of the DOM comparison.
- Lint, formatting, app/Playwright TypeScript checks, production build and
  whitespace checks pass. No dependencies were added. Verification uses mocked
  backend traffic and disables Sentry uploads. Final token deduplication produces
  byte-identical expanded CSS. Oxlint reports 47 warnings and no errors.

This slice and the cumulative delta exceed the approximate 800-line review budget.

| Slice               | Mechanical work                                                             | Scrutiny and evidence                                                                                       |
| ------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Shared control APIs | Native buttons/anchor composed through shared wrappers                      | Native types, href/target/rel, labels and callbacks; full workflow regressions and control view comparisons |
| Page furniture      | Heading/sidebar markup moved into generic components                        | Conditional slots and mobile layout; DOM, bounds and screenshot comparisons                                 |
| SCSS and tokens     | Rules moved with effective cascade retained; exact existing values promoted | Compiled projections at breakpoint edges; all twenty-seven rendered pairs match                             |
| Local reference     | Interactive shared-control/sidebar examples and catalog contracts           | Local-only interactions and keyboard operation; no live backend                                             |

Cumulative review load versus main: **239 files, +15,334 / -9,421 (24,755
lines)**. The maps for Phases 3–4f separate mechanical work from behavior changes.

## Phase 4g — hub composition and shared workspace panels

HostHub is now a route adapter. HostDashboard composes the workspace, summary,
game lists and directory; GameContext composes the overview, progress and hint.
The hub controller owns query/launch state, with named typed query functions in
lib/hostHubQueries.ts and domain response contracts in types/hostHub.ts. Fields,
filters, sort order, limits, preview parameters and the session-launch RPC remain
unchanged. Queries now use the existing runApi error boundary, including its
transport-error normalization and monitoring behavior.

The hub and planning page share ContextCard, Ribbon, CoverArtwork,
ChecklistProgress, SetupAction and HintCard. Each caller supplies its own checks,
markers, summary and action. StatTile/IconBadge and StatusPill provide the summary
and status UI, while ChallengeIcons owns the small challenge-symbol list. All
shared additions have local interactive/reference examples and catalog notes.

This moves 117 active legacy rules into owned SCSS, removes 115 superseded
declarations and deletes 29 unrendered hero selectors. HostHub.css is removed.
Existing design values are reused or promoted as exact-value tokens. Native
list-icon selectors now target the shared Icon class, and plan-image positioning
belongs to CoverArtwork independently of the hub wrapper. Stat elements get owned
BEM classes and icon tones become explicit modifiers; their resulting cascade is
checked in the rendered comparisons rather than assumed from selector spelling.

The fixture backend now respects the hub's existing mutually exclusive date/status
filters and limits. Previously it returned the same rows to upcoming and past
queries, producing duplicate-key console errors that were also present in the
baseline app. This is a fixture correction; no product deduplication or list-query
behavior was changed.

A separate lifecycle correction guards identity, game-list, preview and directory
responses when the view/preview changes or the controller unmounts. Four focused
regressions reproduced stale responses replacing the current state before the
fix and pass afterward. This changes obsolete-request handling intentionally;
it is distinct from the mechanically compared markup/style work.

### Phase 4g verification and review map

- The five added hub journeys pass on both desktop and mobile against the saved
  pre-refactor app: date/status partitioning, platform preview, denied preview,
  query recovery UI and failed launch. The current suite also exercises the new
  shared-panel demo with keyboard-only actions and zero backend requests.
- Seventy-eight compiled selector projections match across eighteen viewport
  samples, covering both sides of every migrated breakpoint. Explicit mappings
  account for owned stat classes, icon selectors and cover-image ownership;
  declarations, effective values and responsive conditions are compared in full.
- Twenty-one rendered view pairs compare normalized DOM, bounds, migrated
  computed-style properties and byte-identical screenshots. Samples cover hub,
  game lists, cover images/challenge icons, drafts/completed plans, empty hub,
  read-only populated preview, planning create/build and saved views on desktop
  and mobile, plus summary/rail breakpoint edges. Finite transitions settle before
  measurement so the progress bar is compared at its target width.
- Unit/component suite: 308 passing tests across 47 files, including four new
  lifecycle regressions that failed before the obsolete-response guard.
- All 118 current desktop/mobile browser cases are verified on the final source.
  The combined run passed 103 cases before its runner exited with SIGTERM; a
  separate mobile smoke run covers the remaining cases plus the two overlapping
  smoke cases. The earlier pre-guard full run also passed all 118 cases.
- Lint, formatting, app/Playwright TypeScript checks, production build and
  whitespace checks pass. Oxlint remains at 47 warnings and no errors. No
  dependencies were added; verification remains isolated from live services.

This slice and the cumulative diff exceed the approximate 800-line review budget.

| Slice                         | Mechanical work                                                                         | Scrutiny and evidence                                                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Route/controller separation   | Route parameters, query state and presentation moved into focused modules               | Query filters/sorting/preview arguments and launch behavior; added journeys also pass on the preserved baseline        |
| Workspace panels              | Existing card/checklist/artwork markup composed through shared presentation components  | Caller-specific markers/actions and empty/read-only states; planning/hub DOM, bounds, style and screenshot comparisons |
| Summary and game presentation | Stat tiles, semantic icon tones, status pills and challenge icons gain owned components | Stat selector specificity and image ownership; breakpoint projections and populated list comparisons                   |
| SCSS ownership                | Effective declarations moved; dead/superseded rules removed; existing values promoted   | Full declaration projections and twenty-one rendered view pairs                                                        |
| Local reference and fixtures  | Shared-panel local state and corrected mocked date filtering                            | Keyboard interactions without backend access; list regressions with no duplicate cards/console errors                  |
| Query lifecycle               | Ignore obsolete async results after view/preview changes and unmount                    | Four failing-before/passing-after race regressions; normal views retain rendered parity                                |

Cumulative review load versus main: **276 files, +17,723 / -11,027 (28,750
lines)**. Review the lifecycle correction separately from the mechanical moves.

## Phase 4h — planning route, controllers and presentation

HostPlanSetup now adapts route/import parameters to PlanEditor. Hydration,
favourite persistence, cover upload, saving, challenge editing and scheduling have
separate controllers. Named data/storage functions live in lib/hostPlanApi.ts;
shared request/response contracts live in types/hostPlanning.ts. Pure plan/import
models preserve stored defaults, legacy selectedTaskIds recovery, schedule phases,
provider-specific import defaults, validation and the existing version-3 payload.

The coordinator composes GameBasicsForm, PlanSidebar, PlanContext,
PlanNavigation, VenueDetails and PlanReviewInfo with the existing feature panels.
The same navigation component serves basics and builder stages. Context panels
continue to use the shared workspace primitives. Catalog notes document the
presentation APIs and connected editor boundary. Stylesheet ownership is queued
as the next slice; expanded SCSS remains byte-identical to the saved baseline.

### Separate behavior corrections

Four operation regressions failed against the extracted legacy behavior and pass
after correction: rapid save activations perform one write, favourite insertions
are serialized per task, obsolete saves cannot navigate after unmount, and cover
uploads cannot replace a different plan's image. Hydration guards also stop reads
and state updates after scope cleanup. The schedule initializer now uses fresh
state on build entry without suppressing hook dependencies; subsequent timeline
edits remain intact.

The route keys the editor by plan identity. A failing-before browser regression
showed that opening a new plan after editing an existing plan retained the old
form/build stage; the keyed editor resets it. Explore JSON receives runtime shape
checks before becoming a Task, so malformed objects use the existing recovery
message instead of injecting invalid task fields.

### Phase 4h verification and review map

- Six planning journeys pass on desktop and mobile against the preserved app:
  schedule add/delete and planned-save payload, phased-task deletion, Explore
  import, invalid-JSON recovery, community prep/performance import, and cover
  upload/favourite persistence. Fixture handlers now explicitly support those
  storage/favourite operations; no live backend is used.
- Thirteen focused unit regressions cover plan compatibility/projection, provider
  defaults, malformed imports, operation scope/locking, stale hydration and
  one-time schedule initialization. Four operation cases failed before their
  fixes. The route-identity browser case failed before its key was added.
- Twenty-six rendered desktop/mobile pairs match in normalized DOM, bounds,
  sampled computed styles and byte-identical screenshots. These cover create,
  every builder tab, an edited plan and an imported task. A deterministic glyph
  shift after a bold phrase exposed a changed React text boundary; preserving
  that boundary restored screenshot equality. Normalization covers adjacent
  React text nodes, class order and fixture server ports.
- The full expanded SCSS output is byte-identical before/after extraction.
- The complete unit/component suite passes: 321 tests across 51 files.
- The complete browser suite passes in separate project runs: 66 desktop and 66
  mobile cases, including all seven planning journeys on the final source.
- Lint, formatting, app/Playwright TypeScript checks, production build and
  whitespace checks pass. Oxlint remains at 47 warnings and no errors. No
  dependencies were added; fixture traffic and verification builds stay isolated
  from live services and Sentry uploads.

This slice and the cumulative diff exceed the approximate 800-line review budget.

| Slice                       | Mechanical work                                                                     | Scrutiny and evidence                                                                                                                     |
| --------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Route and view composition  | Existing markup moved into focused presentation components                          | Props, stage/tab conditions and navigation labels; 26 DOM/style/bounds/screenshot pairs                                                   |
| Domain models and typed API | Existing mappings, fields, filters, storage paths and payload moved out of the page | Legacy recovery and provider defaults; unit regressions and six baseline planning journeys                                                |
| Controller boundaries       | Queries, mutations, challenge editing and scheduling separated by concern           | Existing flow/payload preservation; complete workflow suite and phase-specific regressions                                                |
| Operation/lifecycle fixes   | Scope cleanup, synchronous write locks and editor identity reset                    | Four failing-before unit cases, stale-source tests and failing-before browser identity case; review separately from mechanical extraction |
| Transition to owned styles  | Existing class contracts retained for the next migration slice                      | Byte-identical expanded SCSS and all 26 rendered pairs; no stylesheet changes in this slice                                               |

Cumulative review load versus main: **299 files, +20,511 / -12,322 (32,833
lines)**. Review operation/identity fixes separately from mechanical extraction.

## Phase 4i — owned planning styles and shared controls

Active planning styles now live in 33 owned SCSS block families. The migration
covers 210 active selector rows, removes 117 unused selectors and drops twelve
superseded declarations. Existing design values become exact-value tokens;
recurring heading fragments live in tools. The small final heading-mixin cleanup
produces byte-identical expanded SCSS. Remaining HostPlanning styles serve Explore,
administration and live-host compatibility. In particular, `.cc-round-number`
remains until its live consumers migrate.

ContentPanel supplies common basics/builder surfaces. Shared CountBadge,
PanelHeading, FormGrid, Explainer and ImageUpload preserve native markup and
caller-owned persistence. Nineteen controls use shared setup Button variants;
upload labels reuse their visual class contract. ChallengeTile,
SelectedChallenge, TimelineItem and PlanBuilder own feature presentation. All
new shared APIs have local styleguide examples; their controls never access the
backend.

Separate behavior correction: adding an imported main challenge to the schedule
no longer duplicates its selected ID. A focused regression failed before the fix
and passes afterward, retaining distinct prep/performance entries and preventing
repeat additions. The community-import browser case asserts the saved selection.

### Phase 4i verification and review map

- Compiled declarations match for 164 logical selector projections across sixteen
  viewport samples. Explicit projections account for owned classes/states,
  shared-control resets, upload visuals and frame surface ownership.
- Thirty-eight rendered view pairs match normalized DOM, bounds, computed styles
  and byte-identical screenshots. They cover planning tabs, imports, edits,
  breakpoint edges, and direct live hosting versus live hosting after planning.
  Normalization covers intentional class mappings, adjacent React text nodes and
  local server ports. Only the port-dependent QR subtree is masked in the four
  live views; normalized link destinations are still compared.
- All 322 unit/component tests pass across 51 files. All 134 browser cases pass
  in separate desktop/mobile runs. The new local-reference case verifies keyboard
  filtering, image chooser feedback and navigation callbacks with no API calls.
- Lint, formatting, app/Playwright TypeScript checks, production build and diff
  whitespace checks pass. Existing warnings remain; no dependencies or backend
  contracts changed, and verification uses mocked services with Sentry disabled.

This slice and the cumulative diff exceed the approximate 800-line review budget.

| Slice                         | Mechanical work                                                        | Scrutiny and evidence                                                                       |
| ----------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Owned SCSS                    | Existing effective declarations, BEM mappings and tokens               | Selector projections, breakpoint samples and 38 rendered pairs                              |
| Shared controls and frames    | Button variants, six presentation primitives and common panel surfaces | Native types, upload label contract and cascade resets; styleguide and rendered comparisons |
| Feature presentation          | Tiles, selected rows, timeline rows and builder frame                  | Callback wiring and preserved text boundaries; complete browser suite                       |
| Imported selection correction | Avoid duplicate selected main ID                                       | Failing-before unit regression and saved browser payload; review separately                 |
| Legacy compatibility          | Retained live round-number rule and stylesheet import                  | Direct live and after-planning views match on desktop/mobile                                |

Cumulative review load recorded for Phase 4i: **352 files, +23,068 / -14,379
(37,447 lines)**. Review its imported-selection correction separately from the
mechanical moves.

## Phase 4j — planning keyboard operation and ordering

Side and secret selection move/drop handlers now update their own lists instead
of the main selection. Drag completion clears its transient state, including
invalid cross-list drops. Timeline movement buttons can cross an adjacent break
or other schedule row, matching the existing drag capability; endpoint movement
is disabled. Selected rows have task-specific move/remove names, timeline rows
have named move/duration controls, and library filters/custom fields have explicit
accessible names. Favourite/selection toggles expose their pressed state.

The builder uses a section inside the host shell's existing main landmark.
This is an intentional semantic correction, separate from Phase 4i parity claims.
The standard Playwright configuration now includes hostHub/planning specs, so
`npm run test:e2e` includes the regressions previously run via the phase config.

### Phase 4j verification and review map

- Four new unit regressions failed before correction: side and secret ordering,
  plus upward/downward timeline movement across a break. They pass after the fix.
  Selection tests also cover endpoint no-ops, preservation of unrelated lists,
  drop ordering and rejection/cleanup of an unrelated dragged ID.
- A keyboard-only browser journey starts at an edited plan, tabs through all
  interactions, reorders side/secret/timeline rows, exercises search/filter state
  and saves. It checks the resulting payload, visible native focus, disabled
  endpoint and single main landmark on desktop/mobile. No pointer or scripted
  focus is used to reach the controls.
- Unit/component suite: 326 passing tests across 53 files. Lint, formatting,
  app/Playwright TypeScript checks, production build and whitespace checks pass.
  Verification uses mocked services; backend contracts remain unchanged.
- All 136 browser cases pass: 68 desktop and 68 mobile on the final source.
  The compiled planning-style projections remain equal across sixteen viewport
  samples; this behavior slice introduces no design values or stylesheet changes.
- Default browser discovery lists all 136 cases across four files. The environment
  still has its documented slow unused-port readiness probe; full browser runs
  use the isolated server with the equivalent project configuration. No server
  reuse or environment isolation safeguards were weakened in the committed config.

| Slice                    | Change needing review                                              | Evidence                                                            |
| ------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Selection ordering       | Active side/secret list is updated; unrelated lists preserved      | Two failing-before hook regressions and saved keyboard payload      |
| Timeline ordering        | Native buttons cross breaks like drag/drop                         | Two failing-before component regressions and keyboard save          |
| Semantics and controls   | Named inputs/buttons, pressed states, disabled bounds and one main | Complete keyboard journey on desktop/mobile, including native focus |
| Verification entry point | Default browser command includes planning/hub suites               | Expanded Playwright test discovery and full project runs            |

Cumulative review load versus main: **355 files, +23,434 / -14,380 (37,814
lines)**. The approximate 800-line review budget is exceeded; use the phase maps
and review behavior corrections separately from mechanical migrations.

## Phase 4k — lobby ownership and shared presentation

The six lobby steps now compose shared Avatar, ImageWell, compact StatTile,
ContentPanel/Field/Note lobby variants, StepProgress and Button variants.
Avatar replaces the initial-only account component while preserving its account
appearance. TeamChoiceCard, TeamEditor and CreateTeamForm own the feature's
presentation; the create form is reused by both assignment and naming steps.
Native elements, labels, file accept rules, form submission, disabled conditions
and controller callbacks are preserved.

Ninety-eight existing lobby rules move into 25 owned block families, including
extensions to shared owners. HostLiveGame.css drops from 5,072 to 4,393 lines.
Twenty-nine existing color values become exact-value tokens; font sizes and other
values reuse existing tokens or derive from the pixel scale. Repeated image-cover,
compact-input and compact-select fragments live in tools. Specific host font-reset
and disabled-control precedence is preserved, including controls whose original
font declarations were already overridden. Shared APIs have local reference
examples and updated catalog notes, with no backend access.

### Phase 4k verification and review map

- Two new lobby journeys pass on desktop/mobile against the preserved app before
  migration: all six solo steps, plus capacity, assignment, team creation, rename,
  photo upload and readiness. The mock gains the existing team-capacity PATCH
  response; no application persistence contract changes.
- One hundred logical selector projections preserve the effective declarations
  under explicit BEM/control mappings. Twenty-seven existing stat, field and
  account-avatar selector/media projections retain every declaration; the field
  exclusion uses zero specificity so existing comic variants keep their cascade.
- Thirty-four rendered desktop/mobile pairs compare normalized DOM, bounds,
  sampled computed styles and screenshots. Coverage includes six solo/team
  steps, images/fallbacks, empty rosters, full teams, the hub and host login.
  Normalization accounts for intentional class mappings/additions, adjacent text
  nodes, equivalent font-family case and fixture origins. Port-dependent invite
  text and QR regions are masked in screenshots; their normalized DOM, bounds,
  styles and link targets are still compared.
- Thirty-three screenshots were byte-identical in the full pass. One mobile
  roster capture varied by two pixels at the unchanged session-titlebar edge;
  repeating that pair separately produced identical screenshots and matching
  DOM/styles/bounds. The original captures were retained during investigation.
- The complete unit/component suite passes: 326 tests across 53 files. Lint,
  app/Playwright TypeScript checks, build and whitespace gates pass; Oxlint remains
  at 47 existing warnings and no errors. The default browser command discovers
  all 142 cases across five files. Verification remains isolated from live
  services and Sentry; no dependencies were added.
- All 142 browser cases pass on the finished slice: 71 desktop and 71 mobile,
  including the three new lobby/reference cases in each project.

This slice and the cumulative diff exceed the approximate 800-line review budget.

| Slice                        | Mechanical work                                                                      | Scrutiny and evidence                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Shared identity and surfaces | Account/lobby avatars, image wells, stat variants and native panel/field/note markup | Defaults and image/fallback behavior; 27 existing CSS projections and hub/login/lobby comparisons                 |
| Owned lobby SCSS             | Existing declarations, states and values moved to owned blocks/tokens                | Host font/disabled specificity and original success priority; 100 declaration projections and rendered styles     |
| Feature leaves               | Team choice, editor and repeated create form extracted                               | Callback arguments, native labels/form types, upload reset and disabled conditions; baseline and current journeys |
| Progress and controls        | Data-width presentation and shared Button variants                                   | Six step values, native actions and unchanged geometry; rendered pairs plus local keyboard controls               |
| Verification fixtures        | Existing capacity PATCH modeled; lobby specs included by default                     | Explicit request payload assertions, unexpected-traffic guard and 142 discovered cases                            |

Cumulative review load versus main: **384 files, +24,954 / -15,062 (40,016
lines)**. Use the phase review maps to separate mechanical ownership moves from
behavior changes and inspect the original controller contracts independently.

## Phase 4l — keyboard photo choosers and selection semantics

Avatar and team photo inputs stay in the native tab order through the shared
visually-hidden fragment. Their labels show a purple focus ring; contextual names
identify the upload. Host participation and player/member selection controls
expose aria-pressed. Player buttons use the full player name, preventing avatar
initials from becoming part of the accessible control name. Upload callbacks,
accept rules, storage paths and membership commands are unchanged.

The existing visually-hidden utility uses the same extracted fragment. TeamEditor
has a local keyboard photo-chooser example with filename feedback and no storage
writes. Shared test keyboard navigation helpers now live in tests/support/keyboard.
The mock records game-assets paths and models the existing host-avatar PATCH;
it does not introduce an application request or schema change.

### Phase 4l verification and review map

- Two new journeys failed before the fix on both desktop/mobile: absent pressed
  states and the display:none profile input. They pass afterward. The selection
  journey checks host choice and unassigned/member selection state; it also
  catches the previously duplicated avatar initial in player button names.
- The full keyboard journey starts at the invite screen, tabs to both photo
  inputs, opens the native choosers with Space, joins as host, assigns a player,
  uploads a team image and reaches readiness. It uses no pointer clicks or
  scripted focus. Recorded storage and player-update payloads retain their paths.
- The local-reference browser case opens TeamEditor's native chooser by keyboard,
  reports its filename, clears the input and verifies zero backend requests.
- Four desktop/mobile upload-view pairs retain matching unfocused visible
  structure, bounds, sampled computed styles and byte-identical screenshots.
  Intentional ARIA changes and the hidden file-input boxes are outside that visual
  comparison. Separate focused captures verify a visible three-pixel purple ring.
- Expanded Sass comparison preserves all 929 unaffected rules in order, including
  media conditions and every declaration. Only two input-hiding and two label
  focus rules intentionally change. The existing visually-hidden utility retains
  its declarations.
- Unit/component suite: 326 passing tests across 53 files. Lint, formatting,
  app/Playwright TypeScript checks, build and whitespace checks pass. Oxlint
  remains at 47 warnings and no errors; no dependencies were added. The standard
  browser configuration discovers 146 cases across five files.
- All 146 browser cases pass: 73 desktop and 73 mobile, including the complete
  keyboard upload/assignment path and updated local photo-chooser demo.

| Slice                     | Intentional change                                          | Evidence                                                                                                   |
| ------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Native photo controls     | Focusable clipped inputs, named upload and label focus ring | Failing-before keyboard journey, native chooser events, focus captures and unchanged unfocused screenshots |
| Selection semantics       | Explicit pressed state and full player names                | Desktop/mobile host, unassigned-player and member state checks                                             |
| Shared fragments          | Extract existing hiding declarations; reuse focus ring      | 929 unaffected expanded rules remain identical; four intended rule changes                                 |
| Local reference and mocks | Filename-only demo and existing avatar/storage contracts    | Native chooser test with zero backend requests; exact mocked upload/update assertions                      |

Cumulative review load versus main: **387 files, +25,309 / -15,063 (40,372
lines)**. The full diff exceeds the approximate 800-line review budget; use the
phase maps and review these accessibility behavior changes as a separate slice.

## Phase 4m — obsolete host/player style removal

The remaining legacy host/player sheets now contain 4,546 lines instead of 8,953:
4,407 lines removed. The audit removes 734 unused selector arms and five
unreferenced animations. HostLiveGame.css retains 391 rules and PlayerGame.css
retains 328, including their still-used keyframe steps. Active styling ownership
remains a subsequent migration; this slice introduces no component or controller
changes.

The reference audit inspects 385 source/index/public files and retains forty-four
possible dynamic string prefixes. Each removed selector has a necessary positive
class witness absent from those sources and prefixes (272 distinct witnesses).
Classes nested inside functional pseudos are not used as absence witnesses, so
negations and alternatives cannot create false removal evidence. External Lucide
and Radix prefixes are conservatively protected. Selector lists are parsed into
arms; removal never drops a sibling selector that still has a possible consumer.

Unreferenced animations are checked against remaining source, CSS and Sass,
including dynamic prefixes: cc-reward-score-in, cc-player-reward-arrive,
cc-player-reward-pulse, cc-player-reward-win and join-bounce. The active cc-spin
animation remains. Empty conditional blocks and obsolete consolidation/empty
section comments are removed with the dead rules.

### Phase 4m verification and review map

- Every one of the 803 retained selector arms preserves its source order,
  conditions, declaration values and priority. Expanded project SCSS is
  byte-identical to the preserved source.
- Forty-eight desktop/mobile view pairs match rendered DOM, bounds and sampled
  computed styles. They cover join/rejoin, join after a host visit, four local
  demo views, host controls/scores/participation/lobby, player game/side/scores,
  breaks/completion, reward voting/results, final voting, private missions and
  secret review, plus final/secret TV views.
- Every removed-selector witness is checked in each rendered view; none can make
  a removed selector eligible. Chromium accepts all removed selector syntax,
  avoiding a cleanup that accidentally activates a formerly invalid selector
  list. Normalization covers fixture origins and the baseline public-directory
  symlink alias; origin-dependent QR/invite text is masked in screenshots while
  its normalized DOM and styles are compared.
- Forty-one screenshot pairs are byte-identical. Seven differ only at two pixels
  on a rounded white-card edge. A separate control takes twelve captures of the
  unchanged baseline and twelve of the current app: the baseline itself produces
  two exact image variants differing at those same two pixels, and the current
  image is an exact baseline variant. No application styles or image regions
  were changed to suppress the variance; original captures remain available.
- All 326 unit/component tests across 53 files and all 146 browser cases pass
  (73 desktop and 73 mobile). Lint, formatting, app/Playwright TypeScript checks,
  build and whitespace checks pass. Oxlint remains at 47 warnings and no errors.
  No dependencies, backend contracts or application request paths changed;
  verification remains mocked and Sentry uploads disabled.

This deletion slice and the cumulative diff exceed the approximate 800-line
review budget. The deletions are mechanical; the audit's conservative matching
assumptions deserve scrutiny independently of the retained-declaration proof.

| Slice                | Mechanical work                                      | Scrutiny and evidence                                                                        |
| -------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Selector removal     | Drop only arms with absent necessary class witnesses | Literal/dynamic-prefix audit, functional-pseudo exclusion and all 48 rendered witness checks |
| Cascade preservation | Keep every surviving arm and declaration in order    | 803 selector/condition/declaration projections and byte-identical expanded SCSS              |
| Animation cleanup    | Drop five orphaned keyframe names                    | Source/style/prefix references checked; active spinner and remaining keyframes retained      |
| Rendered behavior    | No application markup/controller changes             | 48 exact DOM/bounds/style comparisons and full unit/browser suites                           |
| Screenshot limit     | Document rounded-edge capture variance               | 41 identical pairs, seven two-pixel differences and unchanged-baseline control captures      |

Cumulative review load versus main: **388 files, +26,129 / -20,222 (46,351
lines)**. Review this cleanup as mechanical deletions, then review active style
ownership and tour behavior separately in the following slices.

## Phase 4n — accessible host tours and shared host frame

This phase has two review slices. The behavior slice repairs the tour before
retiring the hidden topbar; the structural slice migrates the active host frame,
tour trigger and control-panel surface. Both slices are verified against their respective boundaries.

The shared GuidedTour uses the existing native-dialog lifecycle for keyboard
containment, Escape and return focus. Highlighting no longer changes fixed target
positioning. Measured placement keeps its existing offsets as tokens and cancels
its deferred measurement on cleanup. Host tour steps now match visible targets
for lobby, live and completed sessions, and close when the session phase changes.
Navigation stays in the host controller; shared SessionPage/titlebar targets are
optional presentation props.

HostManagement owns its frame and palette in SCSS. ControlPanel composes the
shared ContentPanel controls surface and heading; host and participant tour
triggers use the shared Button session-tour variant. The obsolete topbar markup
is removed only after confirming it is hidden in the baseline. Its sixteen
unreferenced selector arms are removed with a positive source/dynamic-prefix
absence audit. Legacy context aliases remain for descendants awaiting migration.
The local Host patterns reference exercises the frame, panel, action callback
and modal tour without mounting a connected controller or issuing backend calls.

| Slice             | Purpose and mechanical work                                               | Scrutiny and proof                                                                                                                |
| ----------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Tour behavior     | Native modal lifecycle, stable visible targets and phase-aware navigation | Keyboard-only tours through lobby/live/completed states, focus wrapping/restoration, Escape, status transition and no tour writes |
| Shared frame      | Move effective layout and palette to HostManagement SCSS                  | Desktop/mobile DOM, bounds, computed design values and inherited CSS variables against a saved post-behavior baseline             |
| Panel and trigger | Shared ContentPanel/ControlPanel and Button variants                      | Original declaration projections plus normalized class/DOM comparisons; verify native button resets                               |
| Retired header    | Delete hidden markup and sixteen unreferenced selector arms               | Assert baseline display:none and zero height; preserve remaining CSS order, conditions and declarations                           |
| Local reference   | Demonstrate shared composition with local state                           | Keyboard tour/action regression with zero backend requests                                                                        |

### Phase 4n verification and review load

- All 326 unit/component tests across 53 files and all 160 browser cases pass
  (80 desktop and 80 mobile). The browser suite now includes fourteen tour cases:
  complete keyboard tours in lobby/live/completed states, native-dialog focus,
  local/public demos and safe closure after a session-phase transition.
- Lint, formatting, app/Playwright TypeScript checks, production build and diff
  whitespace checks pass. Oxlint reports 46 warnings and zero errors. Verification
  builds disable Sentry uploads; browser traffic uses mocked services.
- All 777 retained legacy selector arms preserve order, conditions, declaration
  values and priority. The 1,006 unaffected expanded SCSS rule projections match
  exactly. Three control-panel declaration sets match after selector mapping and
  equivalent font-family quoting/case normalization; all original tour-trigger
  declarations are retained. Native/shared button resets are checked in-browser.
- Eighteen final desktop/mobile pairs match normalized rendered DOM, layout,
  sampled computed styles and screenshots. They cover host controls, scores,
  inline participation and lobby, player game/side screens, enlarged root text,
  and focused/hovered tour triggers. Normalization permits only the intentional
  class substitutions, fixture origins and public-symlink alias; the hidden
  topbar is omitted only after asserting display:none and zero height. QR/invite
  origin text is masked in screenshots and compared in normalized DOM.
- One preliminary screenshot differed at two card-edge pixels. Twelve captures
  each of the unchanged baseline and current host-participation screen produce
  the same exact image. All final comparison pairs are byte-identical without
  application changes or extra masks to suppress that variation.
- A preliminary desktop run passed 79 cases; its avatar-error case trace showed
  full document reloads clearing in-memory feedback. The isolated case passed.
  After stopping the baseline server and freezing source, complete desktop and
  mobile runs each pass all 80 cases. No application fix or weaker assertion was
  used to hide the failure.

Cumulative review load versus main: **400 files, +26,528 / -20,148 (46,676
lines)**. This exceeds the approximate 800-line review budget. Review tour
behavior separately from the mechanical frame/panel migration and hidden-header
deletion, using the slice map above. No backend contracts, dependencies or live
writes changed in this phase.

## Phase 4o — shared timer and backup-flow controls

HostRoundControls composes the shared TimerReadout, ControlRow timer/break wells,
Note control copy and Button control/timer-menu variants. Replay actions use the
labeled IconButton control-replay variant. The compact panel's stage, progress
arrangement and full-width review placement live in its host-round-controls
partial. Existing pause/menu glyphs are retained for parity and remain queued
for the separate semantic-icon slice.

The backup back/review/next row is now one RoundFlowControls presentation
component used by both HostRoundControls and HostRoundOverview. It preserves the
existing round limits, busy/reward restrictions and review labels. The overview's
additional status action stays in its footer slot with its original handler and
disabled conditions. No timer lifecycle, publishing, round mutation or backend
contract moved into shared presentation.

The local Session timer and flow controls reference demonstrates shared actions,
readouts, replay/menu controls, busy/reward states and local callbacks without
connected hooks. New browser regressions walk host timer actions by keyboard and
assert reset/pause publication fields; the local reference verifies disabled
states and zero backend requests.

| Slice                  | Mechanical changes                                                                  | Scrutiny and proof                                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Shared readout and row | Replace repeated timer markup with TimerReadout and timer/break ControlRow variants | Same rendered elements, labels, bounds and computed styles in idle/running/expired/break states                                         |
| Backup actions         | Consolidate both back/review/next rows into RoundFlowControls                       | Preserve original enable/disable expressions and callbacks; optional overview status action remains supplied by its caller              |
| Action variants        | Shared Button/Note and labeled replay IconButton                                    | Preserve native types, attributes, labels and handlers; focus/hover and keyboard regressions                                            |
| Owned styling          | Move 28 selector arms to component partials and preserve unrelated selectors        | All moved declaration values match; 391 retained host CSS arms and 1,013 unaffected expanded SCSS projections match in order and values |
| Local reference        | Demonstrate the shared parts with controlled state                                  | Keyboard actions, busy/reward restrictions and no backend traffic                                                                       |

Twenty-six desktop/mobile pairs match normalized DOM, bounds, sampled styles and
byte-identical screenshots. The matrix covers idle, running, expired, break,
awarded, active reward and completed controls, the ordinary game view, focused
and hovered action/replay buttons, and enlarged root text. Normalization is
limited to intentional class replacements, equivalent font-family case and
fixture-origin/public-symlink differences. QR/invite origin text is masked in
screenshots and compared in normalized DOM. Static ticking-state comparisons
freeze the one-second interval in both versions and seed the existing host-clock
storage contract; separate real-clock keyboard and browser tests exercise timer
behavior. Expanded declaration comparison normalizes equivalent font-family
quoting/case and slash spacing in grid-column values.

All 326 unit/component tests across 53 files pass. All 164 mocked browser cases
pass: 82 desktop and 82 mobile, including the new timer keyboard and local-state
regressions. Lint, formatting, application/Playwright TypeScript, production build
and diff whitespace checks pass. Oxlint remains at 46 warnings and zero errors.
No dependencies, backend contracts or live writes changed; Sentry uploads remain
disabled for verification builds.

Cumulative review load versus main: **406 files, +27,055 / -20,249 (47,304
lines)**. This exceeds the approximate 800-line review budget. Review the shared
backup-action extraction separately from the mechanical selector/style moves;
the matrix above identifies behavior that deserves scrutiny and the mechanical
proof collected.

## Phase 4p — native host-dialog behavior

The host round override, break-timer and upcoming-challenge editors now compose
shared Dialog with its host variant. The native root owns modal semantics and
the visible heading association; confirmation retains alertdialog semantics.
Forms keep their native submission handlers. Escape, backdrop dismissal and
return focus use the shared lifecycle, while dismissDisabled prevents closing
during a pending write. If disabling the active control would send focus to the
inert background, Dialog focuses its own root until controls are available.

Chromium can initially focus a scrollable form container. The shared hook now
selects the first enabled sequential control after opening, while preserving its
existing Tab boundary handling. The local host-dialog reference demonstrates
keyboard operation, busy-state dismissal guards and pointer backdrop dismissal
without backend traffic.

Challenge save failures previously appeared only in the page-level feedback.
That page is inert while a native modal is open, so the challenge editor now
renders the shared SessionFeedback inside its form and supports dismissal/retry.
The same action error remains available to the page after closing. Both editors
now use the parent's existing error-dismissal behavior to clear the displayed
query/action feedback. Previously they received the combined error but cleared
only action state, so refresh errors could not be dismissed. Two additional
fail-before cases hold the next session read while dismissing an error, proving
that a later successful poll cannot hide a broken dismiss action. The fixture
now explicitly accepts the existing challenge-update contract: five typed
fields, a matching session filter and an existing challenge ID. Unknown payloads
and targets still fail instead of receiving generic successful mock writes.

### Phase 4p verification and review map

The original eight desktop/mobile regressions failed on initial focus before
the change. Eighteen targeted cases now pass, covering focus entry, forward/reverse
wrapping, Escape and return focus, successful timer/challenge payloads, override
cancellation and planned-break-before-round ordering, pending-save keyboard and
pointer guards, local-only demos, both round/start confirmation modes, in-modal
failure/retry and independent dismissal of refresh errors.

This is an intentional accessibility behavior change, not a behavior-neutral
markup move. Eight before/after panel comparisons match panel content, layout
and sampled computed styles, allowing only relocation of the original panel's
modal ARIA to its native parent. The new native parent and backdrop control are
explicit structural changes. Five initial viewport screenshots are identical;
the two mobile form captures consistently differ at 41 and 34 rounded-border
pixels despite equal design values and bounds. Twelve repeated captures per
version reproduce each mobile image consistently with no shared variant, so
these are documented native-dialog compositing differences. A preliminary
desktop error-panel capture differs at two edge pixels, but twelve repeated
baseline/current captures match exactly. No extra masks or application-style
changes suppress the differences. QR/invite origin areas retain their existing
masks; focus is aligned only for appearance comparisons. Keyboard journeys
independently verify the actual focus behavior.

The single retired backdrop selector has no necessary class consumer in the
source/dynamic-prefix audit. All 390 retained host selector arms preserve order,
conditions and declaration values; the player stylesheet is byte-identical.
All 1,044 existing expanded SCSS projections match exactly. The shared Dialog
base/open/host rules preserve all eight original backdrop declarations; native
sizing/reset rules come from the existing shared Dialog foundation. Panel styles
remain transitional so their later mechanical migration has a post-behavior
baseline.

| Slice                  | Change                                                  | Scrutiny and evidence                                                                             |
| ---------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Native modality        | Three host editors compose shared Dialog                | Fail-before focus cases, keyboard containment/Escape/return, native heading/alertdialog semantics |
| Pending operations     | Guard dismissal and retain focus with disabled controls | Deferred timer write, Tab/Escape and pointer guard, eventual save and focus return                |
| Error recovery         | Render challenge failure inside the active modal        | Failed save/retry and query-error dismissal while the next refresh is held                        |
| Persistence boundaries | Keep controller handlers and RPC/update contracts       | Timer payloads, challenge fields/filters, override cancellation and planned break ordering        |
| Overlay presentation   | Shared host variant and one retired legacy selector     | Expanded declaration proof, eight panel comparisons and quantified screenshot limits above        |
| Local reference        | Host-dialog example with controlled busy state          | Keyboard/pointer operation and zero backend requests                                              |

All 326 unit/component tests across 53 files and all 182 mocked browser cases
pass (91 desktop and 91 mobile). This includes eighteen host-dialog cases plus
all existing shared-dialog, tour, player, planning, lobby and legacy smoke
regressions. Lint, formatting, application/Playwright TypeScript, production build
and diff whitespace checks pass. Oxlint now reports 44 warnings and zero errors.
Verification disables Sentry uploads and uses mocked backend traffic only.

Cumulative review load versus main: **414 files, +27,810 / -20,313 (48,123
lines)**. This exceeds the approximate 800-line review budget. Review the native
modal and feedback behavior separately from the mechanically preserved overlay
styling, using the map and screenshot limits above. The remaining legacy editor
panel styles are queued for the next mechanical slice.

## Phase 4q — shared editor panels, fields and actions

The three host editors now compose DialogPanel, DialogActions, Badge dialog,
FormLabel, FormGrid dialog, and Button dialog variants. DialogPanel retains native
form/section semantics and typed native props; it adds no wrapper elements.
FormLabel preserves direct text/control markup, hints, checkbox layout and native
label attributes without adding Field's label span. Both numeric editor fields
keep their existing two-column layout on mobile. DialogNotice composes warning
and error copy, with optional labeled dismissal through IconButton.

Editor handlers, validation attributes, heading IDs and callback wiring remain in
their existing feature/controller boundaries. No focus lifecycle, save command,
query or round-state rule moves into these primitives. The local host-dialog
reference demonstrates the surfaces, labels, hints, numeric fields, notices and
explicit action styles, plus native local form submission and error dismissal.
Its new regression verifies saved preview output and zero backend requests.

Twenty-six legacy selector arms move into owned component partials. The existing
paragraph fragment shared by panel body copy and notices is expressed once in
dialog-copy. Panel prose excludes paragraphs owned by named child components;
notices own their typography and modifiers without elevated specificity. Two
white dismiss-button background declarations were already overridden by the
modal's red tint, including on hover; their effective red-tint value is retained.

### Phase 4q mechanical evidence and review map

- All 364 retained host selector arms preserve order, conditions, declaration
  values and priority. Player CSS is byte-identical. All 1,045 pre-existing
  expanded SCSS projections match exactly; 26 moved selector sets preserve 120
  effective declaration values and important flags. Comparison normalizes only
  equivalent selector/font-family quoting and font-family case.
- Fourteen final desktop/mobile comparisons match the complete native-dialog
  DOM, including raw text nodes, layout and sampled styles. Normalization permits
  only the intentional class substitutions/additions and fixture origin; no
  modal ARIA or elements are omitted. States cover ordinary/start confirmation,
  a newly blocked start, timer/challenge editors and both error views.
- Twelve additional comparisons cover focused/hovered save and dismiss actions
  and enlarged root text. Together the 26 comparisons match DOM and styles;
  25 viewport screenshot pairs are byte-identical. One desktop error-panel
  pair differs at two rounded-border pixels (410,267 and 412,267). An earlier
  capture of unchanged current source matches the exact baseline image, while
  another capture and twelve repeated captures show the two-pixel variant. The
  separate control retains twelve captures per version and the original images;
  no extra masks or design-value changes suppress the difference. Existing
  QR/invite origin masks remain; focus is aligned only for appearance checks.
- A newly covered start-confirmation guard passes on the saved baseline for both
  screen sizes: if team setup becomes invalid while the dialog is open, confirm
  becomes disabled, the blocking message appears, keyboard focus stays on the
  available cancel path, and no start command is sent.

| Slice                     | Mechanical change                                                    | Scrutiny and proof                                                             |
| ------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Panel composition         | Shared form/section surface and explicit action row                  | Native props/types, full DOM and save/override regressions                     |
| Labels and numeric fields | Native label/hint/checkbox primitives and dialog grid variant        | Raw markup, accessible names, two-column mobile layout and existing validation |
| Notices and actions       | Shared notices and explicit Button/IconButton variants               | Effective source values, focus/hover, dismissal/retry and disabled states      |
| Owned styling             | Retire 26 selector arms and register owned partials                  | Retained-cascade and expanded-SCSS projections, 26 rendered comparisons        |
| Local reference and guard | Local submit/error demonstration and newly covered team-change guard | Mock-only keyboard journeys and baseline guard regression                      |

All 326 unit/component tests across 53 files and all 186 mocked browser cases
pass (93 desktop and 93 mobile). This includes the expanded local form/reference
coverage and the team-change guard, plus every existing host, player, planning,
lobby, tour and legacy smoke journey. Lint, formatting, application/Playwright
TypeScript, production build and diff whitespace checks pass. Oxlint remains at
44 warnings and zero errors; explicit native children/htmlFor forwarding avoids
adding a label-association warning. Verification builds disable Sentry uploads;
browser services remain mocked.

Cumulative review load versus main: **423 files, +28,497 / -20,566 (49,063
lines)**. This phase also exceeds the approximate 800-line review budget. Review
the shared component contracts and local examples separately from the mechanical
style/markup moves, then review the newly covered guard with its baseline
result. The map above distinguishes those slices and records the rendering
limit rather than claiming universal screenshot identity.

## Phase 4r — shared session panels

Host overview and invitation now compose SessionInvite, QrFrame, RoundNumber,
RoundSelector and UpcomingChallenge. Nine host card roots use ContentPanel
session surfaces; headings, counts, overlines and helper copy use explicit shared
variants. Feature controllers retain queries, credentials, commands and
navigation. Review, reward and secret mission body styles remain transitional.
The shared round actions retain their comic appearance classes for existing
hover behavior and own explicit normal-state styles with enough specificity to
survive lazy legacy stylesheet loading.

The local Shared session panels and invitation reference demonstrates selection,
disabled actions, compact/stacked surfaces, headers/counts, upcoming challenge,
previous/next/finish action variants and optional team guidance. Its keyboard
regression checks round selection, busy states, team guidance, local copy
feedback, native join-link attributes and zero backend requests.

### Phase 4r mechanical evidence and review map

- All 281 retained host selector arms preserve order, conditions and declarations,
  with two recorded component-reference renames. Player CSS remains
  byte-identical to the saved phase 4q checkpoint. All 1,074 expanded baseline
  SCSS projections remain an identical ordered subsequence. Eighty-three old
  selector arms consolidate into owned styles; overridden historical layers
  are not claimed as identical declaration moves.
- Twenty-four before/after comparisons match raw DOM text nodes, QR SVG markup,
  layout, sampled computed styles and byte-identical screenshots. Four compare
  overview/invitation at 1280px/393px with teams on/off; twelve cover reward
  setup/open/completed, final management, selected secret review and completed
  games at both sizes; four compare 640px/900px with teams on/off; four compare
  focused round chips and hovered next-round controls at desktop/mobile sizes.
- A read-only local proxy supplies the same browser origin to both versions.
  QR codes and join links need no origin masks or normalization. Only intentional
  component class substitutions/additions are normalized; raw text and native
  element/attribute structures remain included. These checks caught and fixed
  a second edit-button caller, count typography, lazy cascade precedence and
  raw JSX text-node segmentation.

| Slice                   | Purpose and mechanical changes                                         | Scrutiny and proof                                                                    |
| ----------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Shared surfaces         | Card, heading, count and helper variants replace legacy markup classes | Native elements/attributes, ordered rule projections and all host panel states        |
| Overview and invitation | Shared round models, QR frame, count and callbacks                     | Full QR DOM, responsive layout, team guidance, focus/hover screenshots                |
| Round actions           | Explicit Button variants retain host comic appearance                  | Lazy legacy cascade precedence, disabled state and existing round/editor regressions  |
| Local reference         | Pure local models and action callbacks                                 | Keyboard selection/busy/team actions, native link attributes, no backend requests     |
| Remaining bodies        | Keep existing submission/reward/secret content rules and controllers   | Deferred to the next independently verified slice; no claim of full styling migration |

All 326 unit/component tests across 53 files and all 188 mocked browser cases
pass (94 desktop and 94 mobile). After the final preview-only addition of explicit
round action examples, all 28 affected local/reference cases pass again.
Application/Playwright TypeScript, lint, formatting and production build pass;
Sentry upload credentials are explicitly disabled for the final build. Source
and documentation remain frozen during browser comparisons and suite runs.

This phase exceeds the approximate 800-line review budget. Review component
contracts and feature adapters separately from the mechanical class/style moves,
then review the local example and keyboard regression. Cumulative review load
is **433 files, +29,510 / -21,072 (50,582 lines)** before the final report
number is inserted.

## Phase 4s — submission/evidence extraction checkpoint

EvidenceReview and EvidenceReviewItem now render the shared image/video review
markup for main, side and secret workflows. They accept resolved presentation
URLs, image descriptions and metadata labels; no persistence or query function
is passed into shared UI. Main and side workflows also compose SubmissionRow
for identity, formatted time, status and evidence/action slots. Each feature
keeps its existing status copy, fallback names, time formatting, approval callbacks
and score rules.

This checkpoint separates structural extraction from styling conversion.
Existing host classes remain intentionally attached to the moved markup; all
191 SCSS and legacy stylesheet files are byte-identical to the saved phase 4r
baseline. The next part of this phase migrates those owned blocks into BEM SCSS,
then continues through the remaining management bodies. The inherited native
video caption concern is retained for its separate accessibility slice.

The local Shared submission and evidence review reference exercises approve,
reset and reject through local state. Its keyboard regression verifies the
status/actions and zero backend requests. A new host evidence regression covers
main pending/approved/rejected rows, side automatic approval copy, secret evidence,
native image/video attributes and the unchanged 17-point approval payload. It
passes on both the saved pre-extraction baseline and refactor at desktop/mobile
sizes. The mock uses a 564-byte generated local WebM for video requests;
its required evidence creation timestamps are checked against the existing
frontend evidence contract. This is not a deployed schema verification.

Four populated/empty desktop/mobile comparisons match complete DOM (including
raw text nodes and QR markup), layout and sampled computed styles without class
normalization. Both empty-state screenshots are byte-identical. Populated
captures differ only inside native video rectangles: the final capture has 113
changed desktop pixels and 7 mobile pixels, zero elsewhere. A prior capture of
the same source matched the populated desktop image exactly; forcing every
native control to paint in the viewport changes the variance. Video metadata
and decoded frame readiness are awaited and playback stays paused at zero. No
media controls, QR codes or image areas are masked. Exact universal screenshot
identity is not claimed for browser-rendered video controls.

| Slice                   | Change                                                       | Scrutiny and evidence                                                                   |
| ----------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Evidence presentation   | One collection/item implementation replaces three copies     | Main/side/secret metadata, native controls/alt/preload attributes, full DOM comparisons |
| Submission presentation | Shared identity/status/children structure                    | Feature-owned label rules and unchanged approval payload; exact DOM/styles              |
| Local reference         | Local approve/reset/reject state and metadata preview        | Desktop/mobile keyboard regression, disabled actions, no backend requests               |
| Test fixtures           | Typed evidence rows and deterministic local WebM             | Baseline and current host regressions, metadata readiness; no live services             |
| Styling boundary        | Retain current classes until separate owned-style conversion | All 191 stylesheet files byte-identical; quantified native-control screenshot limit     |

All 326 unit/component tests across 53 files and all 192 mocked browser cases
pass (96 desktop, 96 mobile). Application/Playwright TypeScript, lint, formatting
and production build pass. Sentry uploads are disabled for the verification
build. No source/documentation edits occur during browser jobs. The final full
suite includes both new evidence regressions and all prior journeys.

Cumulative review load at this checkpoint: **438 files, +29,883 / -21,072
(50,955 lines)** before this report is inserted. The cumulative diff exceeds the
approximate 800-line review budget; use the slice map above and earlier phase
maps. The 564-byte binary fixture is explicitly reported even though the review
script discounts binary files.

## Phase 4s — owned submission/evidence styling

The extracted review components now own BEM blocks in SCSS: submission-list,
submission-row, evidence-review and evidence-review-item. SubmissionRow composes
StatusPill's review variant; its discriminated prop contract keeps review tones
separate from workspace tones. ControlRow review supplies the full-width action
arrangement, including the local reference. Blocks own their elements and the
feature adapters retain approval, scoring, status text and media resolution.
Existing design values are promoted to tokens without intentional visual changes.
The shared 520px breakpoint token also supplies the existing tour breakpoint;
compiled existing rules remain unchanged.

Fifty-six legacy selector arms retire. Historical unskinned/themed declarations
consolidate to their effective host presentation; unreachable evidence metadata
button/saved selectors retire with them. The remaining 225 host selector arms
preserve order, conditions and declarations, with one recorded action-reference
rename. Player CSS is byte-identical. All 1,121 existing expanded SCSS projections
remain an identical ordered subsequence. No retired submission/evidence class
remains in source.

Eight populated/empty comparisons at 1280, 393, 520 and 640px match complete DOM,
including raw text and QR markup, layout and sampled computed styles. Only the
intentional class substitutions/additions are normalized. Every empty-state PNG
and the populated 640px PNG match exactly. Other populated PNG differences are
confined to native video rectangles: 524 pixels at 1280px, 879 at 393px and 919 at
520px, with zero changed pixels elsewhere. Playback stays paused at zero after
metadata/frame readiness; each native control is painted in the viewport. No
image, QR or media area is masked, and universal native-control screenshot
identity is not claimed.

| Slice              | Mechanical changes                                                      | Scrutiny and evidence                                                                         |
| ------------------ | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Review surfaces    | Owned list/row and media blocks replace legacy selectors                | Exact DOM/layout/styles at desktop/mobile and both responsive boundaries                      |
| Shared variants    | Typed StatusPill review tones and ControlRow review actions             | Existing status/callback regressions, local approval/rejection and preserved action reference |
| Tokens and cleanup | Preserve effective design values; retire obsolete metadata action rules | Ordered retained CSS, 1,121 existing SCSS projections, no remaining class consumers           |
| Local reference    | SubmissionList and shared variants compose the existing local demo      | Complete desktop/mobile local keyboard journeys, no backend requests                          |

All 326 unit/component tests across 53 files and all 192 mocked browser cases
pass again (96 desktop and 96 mobile). Application/Playwright TypeScript, lint,
formatting, build and diff whitespace checks pass. Verification builds disable
Sentry uploads and all browser backend traffic remains mocked. Source and
documentation stay frozen while browser jobs run. The cumulative diff remains
above the approximate 800-line review budget; use this slice map alongside
prior phase maps, and review the owned styles separately from the already
verified structural extraction.

Cumulative review load before this report: **443 files, +30,160 / -21,339
(51,499 lines)**. The next checkpoint is saved for phase 4t.

## Phase 4t — assignment presentation checkpoint

AssignmentRow and AssignmentList now render private-mission assignments using
presentation values and optional evidence children. Status precedence, scheduled
time formatting, mission lookup and persistence remain in the feature adapter
and existing controllers. The initial extraction is verified separately: four
populated/empty desktop/mobile comparisons preserve complete raw DOM, layout and
sampled styles before styling conversion.

The row composes IconBadge's assignment variant, with explicit native div markup,
caller-provided decorative illustration and aria-hidden boundary. Its prop
contract separates illustration children from semantic-icon usage. Existing
IconBadge consumers retain their default native span and icon behavior. The
empty mission message now composes EmptyState session with the original inline
layout and icon size. A local assignment example and keyboard regression toggle
between two supplied rows and the empty message without backend access.

Seventeen old selector arms retire into assignment-list/assignment-row and
owned IconBadge/EmptyState variants. The remaining 208 host selector arms preserve
order, conditions and declarations without reference renames; player CSS remains
byte-identical. All 1,144 existing expanded SCSS projections remain an identical
ordered subsequence. No retired assignment, icon-well, empty-message or management
root class remains in source. The management root's old gap was already overridden
by the shared stacked panel; its effective spacing is unchanged.

Six styling comparisons at 1280px, 393px and the existing 700px icon breakpoint
cover populated and empty assignment states. Complete DOM, raw text, QR markup,
layout and sampled styles match after only intentional class normalization. All
three empty PNGs match exactly. Populated differences are wholly inside native
video rectangles: 888 desktop pixels, 927 mobile pixels and 962 pixels at 700px,
with zero changed pixels elsewhere. No media or QR mask is added. A computed
zero-width border-style mismatch in the new icon variant was corrected to preserve
the existing solid reset; no visual value was changed to chase native controls.

| Slice                 | Change                                                 | Scrutiny and evidence                                                                    |
| --------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Structural extraction | Shared assignment row and caller-owned evidence        | Four raw DOM/layout/style comparisons before conversion; feature label rules unchanged   |
| Owned styles          | Row/list blocks and retirement of legacy selector arms | Ordered retained CSS, all existing expanded SCSS rules and six rendered comparisons      |
| Shared variants       | Decorative IconBadge and compact EmptyState            | Explicit native/ARIA contracts, unchanged default consumers, 700px breakpoint comparison |
| Local reference       | Local rows/empty toggle and catalog notes              | Desktop/mobile keyboard regression and zero backend requests                             |

All 326 unit/component tests across 53 files and all 194 mocked browser cases
pass (97 desktop, 97 mobile), including connected main/side/secret evidence and
approval contracts, local references and every prior journey. Application and
Playwright TypeScript, lint, formatting, production build and diff whitespace
checks pass. Verification builds disable Sentry uploads. Source and documentation
stay frozen during browser jobs. This is a checkpoint within phase 4t; secret
assignment/creation forms and reward/final/secret-review controls still remain.

Cumulative review load before this report: **448 files, +30,442 / -21,404
(51,846 lines)**. This remains above the approximate 800-line budget; review
using the slice map above and the earlier maps. A final shared-opacity token
cleanup preserves the entire compiled stylesheet byte-for-byte.

## Phase 4t — mission forms checkpoint

HostSecretMissions now composes controlled MissionAssignmentForm and
MissionCreationForm components. Their choice props use minimal presentation
records and their callbacks accept values/events. The existing controller keeps
trimming, command defaults, sort order, immediate/future scheduling, feedback,
reset behavior and persistence. The initial markup extraction is verified before
styling conversion: desktop/mobile open-form comparisons match complete raw DOM,
layout, sampled styles and byte-identical screenshots.

The forms compose shared FormLabel session/session-checkbox, Disclosure session
and Button session-send. Disclosure preserves native details/summary behavior
and forwards native props. Session form controls retain nested native labels,
required/min/max/length attributes and the existing busy contract: assignment
choices/time and submit actions disable; custom creation fields remain editable.
Owned mission-assignment and mission-creation partials handle only the forms'
layout; shared label/disclosure/button partials own their presentation. Repeated
43px control height and shadow alpha values use shared tokens. Historical design
values are promoted without intentional color or appearance changes.

Thirty-six legacy selector arms retire. All 172 retained host selector arms
preserve order, conditions and declarations without reference renames. Player
CSS is byte-identical and all 1,154 pre-existing expanded SCSS projections remain
an identical ordered subsequence. Two stale comments describing retired sections
are removed after verification; they have no stylesheet behavior.

Ten styling comparisons match complete DOM (including raw text and QR markup),
layout, sampled styles and byte-identical screenshots: desktop/mobile default
open forms, both sides of the 680px breakpoint, and desktop/mobile title focus,
checkbox focus and enabled send-button hover. Interaction comparisons include
outline/offset, resize and flex direction. Only intentional class substitutions
and additions are normalized. No image, QR or other area is masked. The long
creation grid uses CSS repeat for its equivalent two flexible tracks; computed
grid tracks and screenshots match the original. After browser verification a
local Sass columns alias resolves unstable long-line formatting. The entire
compiled stylesheet is byte-identical before/after that final alias cleanup,
and the full lint/format gate and an additional formatter check pass.

A new connected regression passes against both the saved pre-extraction baseline
and final implementation on desktop/mobile. It verifies custom mission trimming,
points/evidence/default duration/sort order payload, creation reset and selection,
immediate assignment timestamp, local datetime-to-ISO scheduling, failed command
retention and retry/reset. Fixed time initializes before mock auth credentials;
the delivery selector uses its existing accessible name including hint text.
The mock accepts only the explicit secret creation payload contract and appends
the local result for subsequent query/selection. This proves mocked frontend
behavior, not deployed database correctness.

The local mission-form reference submits local state only. Its keyboard regression
exercises native disclosure opening, both submit paths, disabled actions/assignment
controls and the intentionally editable creation fields while busy. Catalog notes
cover the feature forms and new shared variants.

| Slice            | Change                                                    | Scrutiny and evidence                                                                |
| ---------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Extraction       | Two controlled feature forms replace coordinator markup   | Separate raw DOM/style/PNG comparisons before conversion; no controller changes      |
| Shared controls  | Native label/disclosure and explicit send variant         | Validation attributes, focus/checkbox/hover comparisons and local keyboard journeys  |
| Owned styles     | Form layout partials, tokens and 36 retired selector arms | Retained CSS and expanded SCSS proofs, breakpoint/interaction rendering checks       |
| Command coverage | Exact creation/assignment/schedule/retry contracts        | New regression passes on saved baseline and final desktop/mobile implementation      |
| Local reference  | Local models, submits and busy controls                   | Zero backend requests and native details behavior; connected controllers never mount |

All 326 unit/component tests across 53 files and all 198 mocked browser cases
pass (99 desktop, 99 mobile). Application/Playwright TypeScript, lint, formatting,
production build and diff whitespace checks pass. Sentry uploads are disabled for
the verification build. Source/documentation remain frozen during browser jobs.
This slice crosses the approximate 800-line review budget; review extraction,
owned styles and command fixtures separately using the map above. Phase 4t still
has reward, final and secret-review controls to migrate.

Cumulative review load before this report: **455 files, +31,122 / -21,566
(52,688 lines)**. Use the review map above to separate extraction, styling and
command/test changes.

## Phase 4t — shared review/presentation controls checkpoint

Final and secret review now compose the same panel, title, picker, grid, count
and action primitives: ContentPanel review-controls, Overline review, FormGrid
review, FormLabel review and StatTile review. Native div/strong/span/label markup
and raw text are retained. StatTile review renders label before value without a
new wrapper. PresentationControls composes the existing session surface for TV
actions and accepts children/native attributes only. Branches, command callbacks,
queries and connection lifecycle remain in their feature/controller boundaries.

Explicit Button review variants preserve two existing appearances: final actions
retain comic hover/active/shadow behavior; native secret actions reset only the
new shared Button base effects. Primary and wide modifiers retain color and grid
placement. In particular, disconnect remains reachable under the original busy
conditions; no blanket disabling or state-management layer is introduced.

Fourteen selector arms retire into owned component partials and explicit variants.
All 158 retained host selector arms preserve order, conditions and declarations
without reference renames; player CSS is byte-identical. All 1,178 pre-existing
expanded SCSS projections remain an identical ordered subsequence. No retired
final-control or secret-TV class remains in source. Existing palette, sizes,
font stack and opacity values are reused/promoted without intentional visual
changes; the legacy metric font stack is preserved rather than rethemed.

Twenty-four before/after comparisons match complete DOM (raw text, native
attributes and QR markup), layout, sampled styles and byte-identical screenshots.
Twelve cover pending/voting/results for final and secret review at desktop/mobile
sizes; four cover connected final/secret presentation layouts; eight compare
native/comic primary-action focus and hover. Only intentional class substitutions
and additions are normalized. No media, QR or other area is masked. Final evidence
is tied to an approved submission so the gallery and cast controls are populated.

Six new command/picker regressions and two presentation regressions pass against
both the saved original implementation and final implementation on desktop/mobile
with the final fixture (sixteen baseline cases). They assert exact open/close/
reopen payloads, picker disabling while voting, final-slide wrapping, secret-slide
boundary disabling, evidence-navigation payloads and connection close on disconnect.
PresentationRequest is replaced with a local EventTarget-based fake; no device
picker or external display is opened. The fixture preserves the existing rule
that final media requires a matching submitted/approved submission.

The local reference demonstrates native/comic/primary/wide/disabled actions,
counts, a picker, voting state and local presentation actions without backend or
connection access. Its keyboard regression uses forward and reverse Tab with
explicit focus assertions. The growing reference exposed the existing arbitrary
forward-Tab test budget for reaching newly inserted earlier controls and the
submission demo's Reject action after Reset. Those tests now follow the direct
Shift+Tab path; they do not jump focus or relax target assertions. The first full
run's two test-path failures are preserved separately; the final complete rerun
passes all cases with application source unchanged.

| Slice                       | Change                                                | Scrutiny and evidence                                                                      |
| --------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Shared composition          | Existing primitives replace repeated control markup   | Complete native DOM/raw text and counts; feature branches/callbacks unchanged              |
| Action variants             | Explicit native/comic, primary and wide presentation  | Focus/hover and connected-layout screenshots; busy/disconnect and disabled controls        |
| Owned styles                | Retire 14 selector arms and preserve effective values | Ordered retained CSS, 1,178 existing SCSS projections, all 24 PNG pairs identical          |
| Command/connection coverage | Pending/voting/results and slide boundaries           | Sixteen final-fixture baseline cases, final regressions and exact payload/close assertions |
| Local reference/test paths  | Local data/state and real keyboard traversal          | Zero backend requests, forward/reverse Tab and explicit focus checks; full rerun passes    |

All 326 unit/component tests across 53 files and all 216 mocked browser cases
pass (108 desktop, 108 mobile) in the final complete run. Application/Playwright
TypeScript, lint, formatting, production build and diff whitespace checks pass.
Verification builds disable Sentry uploads. Source/documentation remain frozen
while browser jobs run. This slice exceeds the approximate 800-line review
budget; review composition, owned styles and command/test fixtures separately
using the map above.

Before the next mechanical review-body move, audit contradictory stale voting/
result status combinations in host management against the requirement to hide
results while voting is open. This is a separate behavior/regression slice;
consistent pending/voting/results parity here does not prove those combinations.
Reward bodies and remaining secret-review content still need migration.

Cumulative review load before this report: **460 files, +32,238 / -21,939
(54,177 lines)**. Use the slice map above to review composition, owned styling
and command/test fixtures independently.

## Phase 4t — contradictory voting-state privacy audit

This is an intentional behavior fix, separate from the preceding presentation
migration. The audit reproduced result leakage when independently refreshed open,
status and completion fields disagreed. All ten new desktop browser cases failed
before the fix. A shared final-view regression also failed because an unpublished
leaderboard rendered with votingOpen/completed both true. Three data-hook cases
reproduced promotion of that leaderboard despite an active voting signal; a fourth
exposed an unchecked null gallery response leaving loading unfinished.

Host final status now treats session/presentation voting-open flags or a voting
challenge row as active before considering a stale results row. Secret review
similarly combines its state flag and selected voting row; an active row remains
in the option set even when its assignment is stale/approved. Management and the
shared review panel mask result details, and the active assignment label says
Voting in progress instead of revealing an old success/fail/points result.
Existing status text/precedence outside an active vote lives in the feature's
pure secretAssignmentStatus helper.

Participant adapters use feature-private voting-state projections. Any known
final flag/status masks winner/count/voter result metadata and completion; the
shared SessionFinalRound independently guards its updated leaderboard. The data
hook retains the raw gallery contract but does not promote a completed gallery's
leaderboard while another voting signal is active, and it accepts a null gallery
without throwing. Secret review masks outcome/tallies/voters/result leaderboard,
retains precedence over reward/ordinary content with a stale outer-open flag,
and shows a shared loading state when active review details are missing.
Player voting actions still require the explicit RPC voting-open flag; a
contradictory status alone gives a read-only view rather than a silent no-op.

This masks unpublished candidate/outcome results; existing turnout/progress
indicators remain. Result/leaderboard data is shown again after voting signals
clear and published completion/results are present. No command payload, scoring
rule, storage key, polling cadence or subscription dependency changes. This is
frontend presentation protection, not deployed schema/policy or atomic-award
verification. Reward's existing single-status guard remains unchanged.

Five new unit regressions pass, bringing the suite to 331 tests across 53 files.
Twenty new desktop/mobile browser cases cover host final session/presentation
flags, host secret state/row flags and stale assignment labels, player final
RPC/status/session signals, player secret status/takeover/missing-details states,
read-only uncertain voting actions and post-closure restoration. The final local
preview deliberately supplies an open vote with stale completion so the shared
component guard remains demonstrated without backend data.

All 201 SCSS/legacy stylesheet files are byte-identical to the saved checkpoint.
No behavior-neutral DOM/screenshot claim is made for the intentionally hidden
content and new loading state; the preceding consistent-state styling evidence
remains recorded separately. Four early post-fix test failures were ambiguous
closed-state vote-count selectors (summary and gallery both show the same count);
the final assertion scopes to the gallery without removing restoration coverage.

| Slice                | Behavior and scrutiny                                                      | Evidence                                                                           |
| -------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Host projections     | Voting flags/status override stale results; active review stays selectable | Host contradictory-state cases, picker/close controls and restored results/labels  |
| Participant adapters | Mask stale result metadata and retain secret-review precedence             | RPC/status/session cases, uncertain read-only actions and missing-details fallback |
| Shared presentation  | Hide final leaderboard with open+completed props                           | Fail-before component regression, local stale-flag preview and closure restoration |
| Query handling       | Skip unpublished leaderboard promotion and accept null gallery             | Three fail-before signal cases plus null-response/loading regression               |
| Styling/commands     | Keep visual tokens and backend contracts intact                            | All 201 stylesheets byte-identical; complete prior command/connection suite passes |

All 331 unit/component tests and all 236 mocked browser cases pass (118 desktop,
118 mobile), including every prior journey. Application/Playwright TypeScript,
lint, formatting, production build and diff whitespace checks pass. Verification
builds disable Sentry uploads; ordinary tests use no live backend. Source and
documentation stay frozen while browser jobs run. The cumulative review load
remains above the approximate 800-line budget; review this behavior change
separately from the earlier mechanical slices using the map above.

Cumulative review load before this report: **469 files, +32,849 / -21,964
(54,813 lines)**. Treat the privacy behavior fix as its own review slice; do not
combine its intentional visibility changes with styling parity claims.

## Phase 4t — shared secret-review bodies

Host secret review now composes ReviewSummary, VoterList and the compact
SessionLeaderboard/SessionRankRow variants. ContentPanel review-result owns the
published result surface; voter rows reuse Badge vote. The host adapter retains
assignment-specific filtering, missing-player names, score/name sorting, the
top-eight limit, voting guards and all command callbacks. Compact rows keep the
original native div/span/b/small markup without adding default leaderboard
headings, avatars or actions.

Extraction was verified before styling: six desktop/mobile pending, voting and
results comparisons matched DOM, computed styles and screenshots exactly after
normalizing only the new result-panel classes. Owned SCSS then retired thirteen
legacy selector arms. All 145 retained host selector arms preserve their order,
conditions and declarations; PlayerGame.css remains byte-identical. All 1,193
existing expanded SCSS projections remain an identical ordered subsequence.

After the styling move, the same six comparisons match DOM, geometry, sampled
computed styles and PNG bytes, normalizing only intentional class changes. Four
additional desktop/mobile success/fail comparisons with ten players also match
exactly. Their captured DOM explicitly verifies score/name tie order, top-eight
truncation, missing-player fallback and exclusion of another assignment's vote.
The local review-body reference demonstrates each primitive using only local
data; desktop/mobile browser checks confirm it makes no backend requests.

The first full browser run passed 234 cases and exposed one keyboard test path
failure per viewport: from the invitation's teams checkbox it tabbed forward
around the expanded styleguide to an earlier Copy button, exceeding the helper's
160-step budget. The corrected test follows three real Shift+Tab steps, asserting
focus at the busy checkbox, native join link and Copy button before Enter. The
budget stays unchanged; no programmatic focus shortcut was added. The new summary
reference also uses the intended dark review-control surface for readable copy.

All 331 unit/component tests and the final full 236 mocked browser cases pass
(118 desktop, 118 mobile). Application and Playwright TypeScript, lint, formatting,
production build and whitespace checks pass. Verification builds disable Sentry
uploads. Source and docs stayed frozen during browser runs. These checks preserve
frontend behavior; they do not establish deployed database correctness.

| Slice                               | Purpose and scrutiny                                                                                           | Mechanical evidence                                                                                                                  |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Presentation extraction             | Shared summary, voter rows and compact ranks; keep domain projection in feature                                | Six pre-styling DOM/style/PNG matches                                                                                                |
| Owned styling                       | Result panel, summary, voter list/badges and compact row modifiers; reset inherited default leaderboard styles | Thirteen retired arms, 145 unchanged retained arms, 1,193 unchanged ordered SCSS projections; ten post-styling DOM/style/PNG matches |
| Local reference and regression path | Backend-free examples; direct reverse keyboard path to existing invitation action                              | Desktop/mobile local checks; complete 236-case final browser run                                                                     |

Cumulative review load before this report: **478 files, +33,106 / -21,992
(55,098 lines)**. This exceeds the approximate 800-line review budget; use the map
above to review extraction, styling and reference/test changes separately from
prior privacy behavior fixes. The full refactor remains active.

## Phase 4u — reward presentation extraction

HostRewardRound now composes controlled RewardSetupForm and RewardAwardControls.
Setup retains challenge-derived points, allowed methods, team availability,
required selection and native number bounds. Manual award controls retain
instructions, selected player/team candidates, editable final points and action
states. The existing useHostRewards hook still owns all persistence, confirmation,
feedback, locking and refresh behavior. No hooks, command modules or other app
source changed; only the reward parent and its two extracted views differ from
the saved checkpoint. The parent is now 297 lines.

Eight new mocked cases per viewport were established against the original
implementation before extracting markup. They cover all three start methods,
challenge-derived points using a deliberately different challenge value, team
option availability, edited start points, both manual methods with player/team
selection, cancellation of confirmation without a write, confirmed edited-point
payloads and release of a completed round. Candidate actions and confirmations
are exercised by keyboard. Early harness corrections used the existing Review
label, scoped its duplicate to Host controls, and checked the native option's
disabled property directly. No application behavior was changed to satisfy them.

Eighteen desktop/mobile comparisons cover all three setup methods, open voting,
both manual methods for players and teams with a selected candidate/edited points,
and a completed reward. Raw rendered DOM, geometry, sampled computed styles and
PNG bytes match exactly; no class normalization is needed. All 203 SCSS and legacy
CSS files remain byte-identical. A temporary comparison-helper module-cache
collision was corrected before the complete successful run.

All 331 unit/component tests and all 252 mocked browser cases pass (126 desktop,
126 mobile). Application and Playwright TypeScript, lint, formatting, production
build and whitespace checks pass. Source and docs stayed frozen during browser
runs. Verification uses no live backend and builds disable Sentry uploads.

Existing finding, left unchanged outside this presentation slice: manual award
confirmation copy interpolates the round's configured points even after final
points are edited; the command correctly sends the edited value. A separate
behavior change would need to align that copy and explicitly test it.

| Slice                   | Purpose and scrutiny                                                                                                | Evidence                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Reward regressions      | Start/award/release contracts, native controls and cancelled confirmation                                           | Sixteen new desktop/mobile cases pass before and after extraction                                 |
| Presentation extraction | Move setup and manual award markup into named feature components; preserve parent composition and controlled values | Eighteen raw DOM/style/PNG matches; every other app source file and all 203 stylesheets unchanged |
| Full verification       | Preserve shared host/player, planning, lobby, timer, dialog, tour and privacy journeys                              | 331 unit/component tests; 252 mocked browser cases; TypeScript, lint and build                    |

Cumulative review load before this report: **482 files, +33,650 / -22,141
(55,791 lines)**. The cumulative diff remains above the approximate 800-line
budget; review regression additions independently from the mechanical markup
extraction. Owned reward SCSS is the next slice, not part of this parity claim.

## Phase 4u — reward shared primitives and owned styling

Reward setup and manual awards now compose shared FormLabel reward/award-points,
ControlRow reward and Explainer reward variants. RoundSummary owns the method
header's arrangement and receives presentation slots for IconBadge method and
StatusPill reward. CandidateList groups the existing SessionCandidate rows.
RewardSetupForm retains native form coordination; reward-setup and reward-review
owned blocks contain only their layout and content arrangement. New tokens
promote the existing colors, sizes and breakpoint without intentional redesign.

Forty-one legacy selector arms were retired, including the reward arm of a mixed
review/action selector. The 104 retained host selector arms keep the same order,
conditions and declarations. PlayerGame.css is byte-identical; all 1,206 previous
expanded SCSS projections remain an identical ordered subsequence. Shared
variants explicitly reset inherited defaults such as status text transform,
method-badge sizing and instruction-panel spacing rather than borrowing another
block's elements or leaving route overrides.

Eighteen desktop/mobile setup, voting, player/team award and completed-state
comparisons match rendered DOM, geometry, sampled computed styles and PNG bytes
exactly after only intentional class normalization. Eight more comparisons cover
setup/manual action focus and hover, including outlines; all match exactly.
The final comparison helper preserves unrelated component classes and includes
the explicit open-status class rename. No query, command, score, timer or
subscription behavior changes. The existing overlay and close-button classes
remain for the separate modal behavior slice.

Local reward primitives demonstrate all method tones, open/completed sentence-
case statuses, native disabled fields/actions, selected disabled candidates and
read-only candidates. Desktop/mobile checks confirm native bounds/disabled states,
52px method badges and zero backend requests. The example was visually inspected.
Existing low-contrast colors remain unchanged: white on the points-label surface
(#faf9ff) is approximately 1.05:1; instruction copy (#625d71) on #352186 is
approximately 1.94:1. These are recorded for a separate accessibility/design
change, not hidden by a behavior-neutral parity claim.

All 331 unit/component tests and all 252 mocked browser cases pass (126 desktop,
126 mobile), including every reward command regression. Application/Playwright
TypeScript, lint, formatting, production build and whitespace checks pass.
Verification builds disable Sentry uploads and tests do not use a live backend.
Source and docs stayed frozen while browser jobs ran.

| Slice             | Purpose and scrutiny                                                                                             | Mechanical evidence                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Shared primitives | Native form labels, action rows, instructions, method/status markers, summary and candidate grouping             | Eighteen state comparisons plus eight focus/hover DOM/style/PNG matches                       |
| Owned SCSS        | Move effective reward styling into tokens and owned partials; preserve inherited defaults and 650px/520px reflow | Forty-one retired arms, 104 unchanged retained arms, 1,206 unchanged ordered SCSS projections |
| Local reference   | Demonstrate native disabled/read-only states without connected controllers                                       | Desktop/mobile native-state/dimension checks, visual inspection and zero backend requests     |
| Existing journeys | Retain host/player coordination and reward command behavior                                                      | Full 331-unit and 252-browser suites; lint, TypeScript and production build                   |

Cumulative review load before this report: **489 files, +33,993 / -22,217
(56,210 lines)**. Reviewer pressure remains well above the approximate 800-line
budget; review this styling slice separately from extraction and from later modal
or contrast behavior changes using the map above. The full refactor stays active.

## Phase 4v — reward modal focus and feedback lifecycle

Reward overlays now compose the existing shared native Dialog. Opening focuses
the close control; forward/reverse Tab stays inside; Escape, close and backdrop
dismissal restore the opener without issuing a reward command. During start or
award writes, close/backdrop/Escape dismissal is blocked and focus remains in the
modal even when all controls disable. The host coordinator supplies one feedback
slot: errors/notices render inside the open modal, then return to ordinary page
feedback when it closes. Dismiss/retry actions stay reachable without waiting for
a poll. Inline reward content retains its ordinary page behavior.

Four initial desktop regressions failed before this change: focus stayed outside,
close remained enabled during start/award writes, and command errors were absent
from the modal. A further real-shaped mocked release refreshed the round to
released, removed Continue reward flow and left focus on BODY. Both release and
cancel regressions reproduced that case after the initial native-dialog fix.
useNavigationFocus now attaches to SessionNavigation through an optional native
ref. After successful release/cancel reloads, it waits for the commit and focuses
the active navigation item only if focus fell back to the document. Existing
control focus is preserved; detached refs are ignored and pending frames cancel
on unmount. No command payload or write ordering changed. The local session
reference demonstrates removal of a temporary host view and recovery to Game.

Six new cases per viewport cover keyboard containment, close/Escape/backdrop
restoration, pending start/award writes, reachable error dismissal/retry/notice
feedback and release/cancel removal of the original opener. Original reward
payload/selection regressions remain intact. Pending/retry fixtures were given
explicit success responses after the harness correctly rejected unconfigured
RPCs; application behavior was not changed for that correction.

All 207 SCSS/legacy stylesheets, persistence modules and legacy game hooks are
byte-identical to the saved styling checkpoint. Eighteen desktop/mobile panel
comparisons match viewport geometry, inner DOM and sampled computed styles,
excluding only the three root dialog attributes intentionally moved to the new
native dialog wrapper. This is an intentional interaction/outer-DOM change, so
there is no claim of whole-page DOM parity. All nine desktop panel PNGs and the
mobile voting PNG match exactly. Mobile setup changes 46 pixels by one channel
level; manual-award frame pixels differ by up to 53, with at most one level in a
24px content inset; completed-state differences affect 47 pixels by at most four.
Both manual-award images were visually inspected. These bounded raster/frame
paint differences accompany native top-layer composition; exact mobile PNG parity
is not claimed. No color, token, breakpoint or stylesheet was changed to hide them.

A final unit run exposed an existing asynchronous join-test race: it awaited
credential storage and immediately asserted routing. The assertion now waits for
the route outcome itself; production join code is unchanged. All 331 unit tests
across 53 files pass. All final 264 mocked browser cases pass (132 desktop,
132 mobile), alongside application/Playwright TypeScript, lint, formatting,
production build and whitespace checks. One earlier desktop process and the
saved-baseline server terminated with SIGTERM; their handles were confirmed
terminal before restarting. Final complete runs and comparisons use separate logs.
Source and docs stayed frozen during browser jobs. Builds disable Sentry uploads;
tests do not use a live backend.

| Slice                    | Behavior and scrutiny                                                                       | Evidence                                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Native modal composition | Focus containment, inert background, dismissal and pending-write protection                 | Four fail-before cases; complete desktop/mobile modal cases and all prior reward commands                                               |
| Feedback coordination    | Render and dismiss command/query feedback in the accessible modal, preserve inline feedback | Failed-command retry with identical payload; accessible in-modal error and notice actions                                               |
| Return-focus lifecycle   | Recover when release/cancel refresh removes the opener without stealing other focus         | Two additional fail-before cases, both viewports; local backend-free preview recovery                                                   |
| Styling boundary         | Keep existing panel appearance; accept documented native frame raster differences           | All 207 stylesheets unchanged; eighteen exact geometry/inner-DOM/computed-style comparisons; bounded PNG analysis and visual inspection |
| Test synchronization     | Await actual join route outcome                                                             | Final 331-unit, 264-browser, TypeScript/lint/build gates                                                                                |

Cumulative review load before this report: **493 files, +34,370 / -22,224
(56,594 lines)**. Reviewer pressure remains above the approximate 800-line budget.
Review native interaction and focus/feedback coordination separately from the
preceding mechanical styling slice, using the map above. Existing reward contrast
and confirmation-copy findings remain separate and unchanged.

## Phase 4w — owned overlay frame and close-action styling

The last reward-overlay CSS now belongs to shared presentation: ContentPanel
overlay owns the centered/scrolled frame and scrim/shadow geometry; PanelHeading
dismissible reserves room for the close action; Button overlay-dismiss retains
the existing native text close mark, accessible label and disabled/focus states.
The visual props add no modal lifecycle behavior. HostRewardRound still composes
the existing Dialog and retains all previously verified feedback and return-focus
coordination. Existing values became tokens; no intentional theme change occurred.
The owned overlay modifier follows the session surface in its component partial,
so the former important declarations are unnecessary.

Three legacy selector arms were retired. The other 101 host selector arms keep
their order, conditions and declarations. PlayerGame.css remains byte-identical;
all 1,244 existing expanded SCSS projections remain an identical ordered
subsequence. New partial registration was unnecessary because these are variants
of existing owned components.

Eighteen desktop/mobile reward-state comparisons match full rendered main DOM,
geometry, sampled computed styles (including outline and transition properties)
and PNG bytes exactly after only the explicit class renames/additions are
normalized. Six additional comparisons cover close-button focus, hover and
pending-write disabled states on both widths; these also match exactly. The
baseline already uses the native Dialog, so the prior intentional top-layer paint
differences do not apply to this styling comparison.

The shared-overlay styleguide example uses local state, native fields/buttons
and Dialog; it never mounts connected controllers. Its two new desktop/mobile
cases verify local focus containment, guarded busy dismissal and restoration to
the opener with zero backend requests. Shared component catalog notes describe
the distinction between frame/layout props and modal behavior.

All 331 unit/component tests and all 266 mocked browser cases pass (133 desktop,
133 mobile), including every prior reward/modal/payload/privacy journey.
Application/Playwright TypeScript, lint, formatting, production build and
whitespace checks pass. Verification builds disable Sentry uploads; tests use no
live backend. Source and documentation stayed frozen during browser jobs.

| Slice                                 | Purpose and scrutiny                                                                                       | Evidence                                                                                  |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Shared frame/header/button            | Replace legacy override classes with explicit presentation props/variants; preserve native dialog behavior | Eighteen state plus six close-interaction DOM/style/PNG matches                           |
| Owned SCSS and tokens                 | Preserve frame geometry and native button effects without important overrides                              | Three retired arms, 101 unchanged retained arms, 1,244 unchanged ordered SCSS projections |
| Local reference and full verification | Keep modal busy/focus behavior backend-free and retain existing journeys                                   | Two new local cases; complete 331-unit/266-browser, TypeScript/lint/build gates           |

Cumulative review load before this report: **494 files, +34,630 / -22,263
(56,893 lines)**. Reviewer pressure remains above the approximate 800-line budget.
Review this mechanical styling slice separately from the preceding modal behavior
fix, using the map above. The full refactor remains active.

## Phase 4x — shared upcoming stage and round-plan extraction

HostSession now composes shared StagePreview and RoundPlan. A feature-private
upcomingStageModel retains next-round availability, active-break precedence,
stage copy, resume-round fallback and the existing challenge illustration mapping.
RoundPlan composes detailed RoundSelector; both detailed choices and existing chip
choices use RoundChoice. Shared views receive presentation records/capabilities
and callbacks, never backend, route or storage access. The feature still guards
live selection and invokes the original autoplay/round command path. HostSession
is now 1,216 lines; its timer, polling and command controllers are unchanged.

Six new production cases per viewport passed against the original presentation
before extraction. They cover forward/backward selection, selected/disabled state,
autoplay confirmation and cancellation, planned-break-before-round write order,
active-break copy/edit-action precedence and completed read-only state. The
selection cases additionally hold the command pending, verify both choices disable
and confirm Enter cannot issue a duplicate command; those strengthened cases also
passed against the original baseline. An initial active-break fixture seeded only
the server row; it was corrected to seed the existing host clock's browser-storage
hydration source as well. No application timer behavior changed for the fixture.

Twelve desktop/mobile normal, planned-break, active-break, completed, last-round
and autoplay comparisons match raw rendered main DOM, geometry, sampled computed
styles and PNG bytes exactly, with no class normalization. Two more pending-write
comparisons also match exactly. Deterministic clock installation prevents ticking
from contaminating those render comparisons; real command/timer behavior remains
covered by browser and unit regressions. All 207 stylesheets, the host timer hook,
session data/polling hook and round command boundary are byte-identical to the
saved checkpoint. Legacy classes remain deliberately for the separate styling
slice, rather than claiming extraction also completed the SCSS migration.

The backend-free local stage/plan reference demonstrates selection, read-only
state, highlighted break presentation and stage callbacks. Its two viewport cases
assert zero backend requests. The first full run exposed two styleguide dialog
paths per viewport exceeding the helper's 160 forward-Tab budget after the new
examples expanded the page. The helper now accepts an explicit reverse direction;
the two cases assert initial document focus and use native Shift+Tab to the opener.
The budget remains 160, no focus is assigned programmatically, and the complete
keyboard interaction still runs. Both corrected cases pass on both widths.
A locator expression was also simplified after a first formatting pass produced
a chain that Prettier changed on its next check.

All 331 unit/component tests across 53 files pass, along with lint, formatting,
application/Playwright TypeScript, production build and whitespace checks. The
final desktop run passes 140 cases. The interrupted mobile run lost its terminal
handle before its final summary; a subsequent mobile attempt lost its frontend
server after 17 cases and failed with connection refusals. After confirming no
listener remained, the final mobile verification ran with its dummy-config server
owned and monitored by the same process, stopping immediately on server failure.
That complete run passes all 140 mobile cases: 280 browser cases in total. Source
and docs stayed frozen during browser runs. Verification builds disable Sentry
uploads, and ordinary tests never use a live backend.

| Slice                                      | Purpose and scrutiny                                                                                                | Evidence                                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Feature projection and shared presentation | Keep stage precedence/copy and command coordination in the feature; share stage, plan and both round-option layouts | Fourteen exact raw DOM/style/PNG comparisons; unchanged timer/query/command boundaries and all 207 stylesheets     |
| Production regressions                     | Preserve forward/backward, autoplay, planned-break, active-break, completed and pending-write contracts             | Twelve new viewport cases established before extraction; strengthened pending cases also pass against the baseline |
| Local reference and keyboard paths         | Keep examples backend-free; navigate expanded references through native keyboard paths                              | Two new local cases; corrected reverse-Tab journeys with unchanged budget; final full 280-case browser coverage    |

Cumulative review load before this report: **501 files, +35,275 / -22,263
(57,538 lines)**. Reviewer pressure remains above the approximate 800-line budget.
Use the map above to review regression additions separately from the mechanical
extraction and upcoming styling conversion. The full refactor remains active.

## Phase 4y — owned stage and detailed round styling

StagePreview, detailed RoundSelector and RoundChoice now own their BEM SCSS.
Stage labels and illustrations compose Badge/IconBadge variants; round numbers
compose CountBadge and detailed choices use the shared native Button. Existing
legacy design values were promoted or derived without redesign. Feature stage
projection, callbacks, incoming order, timer/polling and command boundaries are
unchanged. The local stage/plan example exercises the migrated primitives and
its catalog notes describe their owned styling.

Verification completed with source and documentation frozen during browser jobs:

- Lint, strict TypeScript/production build and Playwright type checks pass;
  Sentry uploads were disabled. All **331 unit/component tests** pass.
- The full mocked suite passes **280 browser cases**: 140 desktop and 140 mobile.
- **22 exact DOM, geometry, computed-style and PNG comparisons** pass: twelve
  state/viewport combinations, two pending-write combinations and eight focused
  or hovered combinations. All standard computed properties inside migrated
  subtrees were compared; only intentional class renames were normalized.
- The comparison caught a missing selected-row outline, which was restored before
  the final passing comparisons. Focus, hover and selected-disabled appearance
  are included in the evidence rather than inferred from default screenshots.
- CSS parsing confirms **37 retired legacy selector arms**, **64 retained arms**
  with identical order, conditions and declarations, byte-identical PlayerGame
  CSS, and **1,247 previous expanded SCSS projections** retained unchanged and
  in order. Browser comparisons establish effective cascade parity.

| Review slice                 | Purpose / scrutiny                                                        | Mechanical proof                                                           |
| ---------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Shared stage and round views | Verify native element/attribute preservation and variant composition      | Exact DOM and all standard computed properties within migrated subtrees    |
| Owned styles and tokens      | Preserve legacy palette, selected outline, spacing and interaction states | CSS projections plus 22 exact viewport/state PNG comparisons               |
| Feature boundaries           | Keep models, timers, polling and write ordering outside presentation      | Unchanged feature controllers; 331 unit and 280 mocked browser regressions |

Cumulative review load before this report: **503 files, +35,361 / -22,355
(57,716 lines)**. Reviewer pressure remains above the approximate 800-line budget;
review this mechanical styling slice separately from earlier extraction and
behavior changes. This is a verified checkpoint, not full-refactor completion.

## Phase 4z — shared panel layout

The host controls invitation and round overview now compose PanelGrid. This
presentation-only native div accepts ordinary attributes and children. Its BEM
partial owns the existing wider-first-column layout, 16px gap, start alignment
and 900px stacking breakpoint; the existing 255px side-column minimum was
promoted unchanged. No reads, timers, commands, panel order or child components
moved. The local host-frame example now demonstrates two panels and catalog
notes describe the layout contract.

The five overlapping legacy grid selector arms were consolidated into the owned
block. The remaining **59 HostLiveGame selector arms** retain their exact order,
conditions and declarations. PlayerGame CSS is byte-identical, and all **1,271
previous expanded SCSS projections** remain unchanged in order.

Verification:

- Lint, formatting, strict TypeScript/production build and all **331 unit tests**
  pass. Verification builds disable Sentry uploads.
- **Twelve exact before/after DOM, geometry, computed-style and PNG comparisons**
  pass. Normal layout was compared at 1280, 901, 900, 850, 640 and 393px; planned
  break, active break and completed states were compared at 1280 and 393px.
  Only the grid class rename was normalized; all standard computed properties
  inside the migrated grid and its descendants were checked.
- **28 affected browser regressions** pass: fourteen per viewport, covering round
  commands, pending-write locking, break/read-only states, local examples and
  native keyboard tours. The preceding stage/round checkpoint also passed the
  full 280-case browser suite. This slice did not rerun unrelated journeys.
- Source and documentation remained frozen during browser jobs. All backend
  interactions used deterministic mocks; no live writes or deployments occurred.

| Review slice                   | Purpose / scrutiny                                              | Proof                                                                                              |
| ------------------------------ | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| PanelGrid and host composition | Preserve the div, child order and native attributes             | Twelve exact rendered comparisons; feature controller code unchanged                               |
| Owned grid styles              | Consolidate the effective cascade without moving the breakpoint | Six normal widths including 901/900px, six phase comparisons, retained CSS projections             |
| Local reference                | Demonstrate two-panel composition with local controls/context   | Existing full keyboard tour and action journey passes on desktop/mobile with zero backend requests |

Cumulative review load before this report: **505 files, +35,474 / -22,370
(57,844 lines)**. Reviewer pressure remains far above the approximate 800-line
budget. Review the small layout consolidation separately from the earlier architectural extraction,
shared styling and intentional behavior changes. The full refactor stays active.

## Phase 5a — retire obsolete host compatibility selectors

Removed thirty obsolete selector arms and stale commentary from HostLiveGame.css,
reducing it from 291 to 84 lines. The remaining twenty-nine active selector arms
retain their exact order, conditions and declarations. The stylesheet still owns
transitional frame focus/motion and comic control overrides; this slice does not
claim that host styling migration is complete.

The caller/composition audit distinguished old classes from active equivalents:

- The live route composes HostSession through HostGuard's Outlet and the shared
  SessionPage. It does not nest HostManagement inside HostShell/HostWorkspace.
  The old `.host-portal--app:has(...)` layout/header/navigation overrides therefore
  describe the retired wrapper composition. Local host-shell examples contain
  local workspace content; host-frame examples are separate session previews.
- Exact old avatar/team classes have no TSX callers. Current shared Avatar and
  team presentation retain their owned classes. Similar longer player class
  names are separate selectors and were not removed.
- Host alerts remain used in login/planning/workspace routes, outside the live
  host frame. Their global styles stay intact; only obsolete live-frame
  descendant overrides were retired. Live host feedback uses SessionFeedback.
- Legacy player header/profile/titlebar classes remain in PlayerDemo, outside
  HostManagement. Their player styles remain intact; the obsolete host-frame
  descendant overrides were retired.

Mechanical verification:

- All **671 other source, style and test files** are byte-identical to the
  preceding checkpoint. PlayerGame CSS is byte-identical; all **1,273 expanded
  SCSS projections** are exactly identical. No runtime source, payload, timer,
  query, subscription or command changed in this cleanup.
- **24 exact DOM, geometry, all-standard-computed-property and PNG comparisons**
  pass: twelve live-state/width combinations and each of six lobby steps at
  1280/393px. The live comparisons include 901/900px stacking boundaries, planned
  and active breaks, and completed sessions. Every retired selector is also
  asserted to match zero elements throughout these rendered cases.
- The full mocked suite passes **280 browser cases**: 140 desktop and 140 mobile.
  All **331 unit/component tests**, lint/formatting, strict TypeScript build and
  Playwright type checks pass. Sentry uploads were disabled; no live backend
  writes, database changes or deployment occurred.
- Source and documentation were frozen during browser jobs; monitored server
  ownership ended cleanly when both projects completed.

| Review slice                     | Purpose / scrutiny                                                                 | Proof                                                                                                           |
| -------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Obsolete wrapper selectors       | Verify HostGuard/SessionPage composition and separate workspace/reference wrappers | Caller audit, zero matches in 24 rendered cases and full route/browser regressions                              |
| Avatar/team/header/alert aliases | Distinguish exact retired descendants from active player/workspace classes         | Source/composition audit, byte-identical active styles and exact rendered comparisons                           |
| Retained frame rules             | Preserve active buttons, focus and reduced-motion behavior for the next migration  | Identical retained selector declarations/order/conditions, exact SCSS projections and 280 passing browser cases |

Cumulative review load before this report: **505 files, +35,331 / -22,433
(57,764 lines)**. Reviewer pressure remains above the approximate 800-line budget;
review the deletion/caller audit separately from PanelGrid and earlier extraction
or intentional behavior slices. Full-refactor completion remains unproven.

## Phase 5b — retire the live-host stylesheet

HostLiveGame.css and its import are removed. The final twenty-nine selector arms
now resolve through owned SCSS or were retired with obsolete context. Host frame
focus and reduced-motion rules live in HostManagement's block; HTML/body host
surface rules live in the global layer. Existing values were promoted unchanged
into tokens. The intentionally retained reduced-motion important declarations
preserve the original behavior.

Button session-action, session-secondary and session-ghost explicitly own the
live pink/ghost appearances. Session-send composes the action appearance; round
controls preserve their distinct base/hover/active shadows. Shared SessionInvite
and feature reward/submission/mission views select these appearances directly.
The matching local references and catalog notes are updated, including native
button/link semantics and disabled examples. A first comparison caught the two
invitation controls still using the old appearance variants; they were migrated
before the final passing comparisons.

Removed the three old frame classes, thirteen unused palette aliases, three
unused palette tokens, the superseded reward-row context override and an
unreachable nested-workspace mobile rule. The `--lime` alias still has a live
consumer and is retained. Secret-review cards continue to use the existing
stacked ContentPanel gap; their overridden legacy gap/class was removed.
HostPortal.css, HostPlanning.css, PlayerGame.css and remaining utility consumers
are separate migration work; this does not claim whole-app completion.

Mechanical evidence and verification:

- **1,270 prior expanded SCSS projections** remain unchanged and in order.
  Three specific context/palette rows were retired or replaced. All ordinary
  HostManagement content declarations are identical; only thirteen custom-property
  definitions were removed from that rule. PlayerGame CSS is byte-identical.
- **72 backend boundary, model and feature-controller modules** are byte-identical.
  Runtime source changes select presentation variants/classes and remove the
  retired stylesheet import; RPCs, persistence, polling and timers are unchanged.
- **82 exact rendered comparisons** pass, checking DOM, geometry, standard
  computed properties and PNG bytes in their stated scopes. Intentional class
  additions/removals are normalized; retired custom-property definitions are
  outside standard-computed-property parity claims.
- The full mocked suite passes **280 browser cases**: 140 desktop and 140 mobile.
  All **331 unit/component tests**, lint/formatting, strict TypeScript production
  build and Playwright type checks pass. Sentry uploads were disabled.
- Source/documentation stayed frozen during browser jobs. Owned servers ended
  cleanly. No live backend writes, schema changes or deployment occurred.

| Review slice                         | Purpose / scrutiny                                                                | Proof                                                                                                                                   |
| ------------------------------------ | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Frame, surface and class retirement  | Preserve native focus, motion and global load-order behavior                      | 24 full live/lobby comparisons; four additional full comparisons include all standard HTML/body/root properties and geometry            |
| Explicit shared button appearances   | Preserve palette, native semantics, base/hover/active shadows and caller states   | 18 full reward-state comparisons; twelve modal-panel focus/hover/active comparisons; existing command and pending-write regressions     |
| Native controls and reduced motion   | Preserve invitation/round interactions, field focus and motion preferences        | 24 target-control/frame comparisons: focus, hover, active, keyboard field focus, mouse checkbox focus and reduced motion at both widths |
| Local reference / feature boundaries | Demonstrate shared appearances with local state; keep backend work in controllers | Updated local examples/catalog, backend-free browser journeys, 72 byte-identical modules and complete 280-case regression suite         |

Cumulative review load before this report: **506 files, +35,409 / -22,458
(57,867 lines)**. Reviewer pressure remains above the approximate 800-line budget.
Review this frame/button styling slice separately from earlier controller
extraction and intentional behavior changes using the map above.

## Phase 5c — shared team choices and host/player name form

TeamNameForm now owns the controlled team-name input/native form used by the
participant picker and both host lobby team-creation entry points. Its shared
input retains the existing accessible name and 40-character limit. Callers own
placeholder projection, the submit control, native button type, busy state,
trimming and commands. The participant input remains editable during pending
operations, matching the existing contract.

ChoiceOption receives label/description, visual selected state, native button
attributes and callbacks. ParticipantTeams retains capacity, membership and
status-copy projection. The host CreateTeamForm adapter retains the team-count
placeholder and lobby button. No query, storage, timer or command moved into
shared presentation. Local references demonstrate both form variants and choice
states without mounting connected controllers.

This is the independently verified extraction checkpoint. Existing legacy
classes/styles remain; their owned SCSS conversion is queued next. Accessibility
behavior changes remain separate.

Verification:

- **Eight production browser regressions** were established against the original
  UI before extraction. They cover selected/full capacity, pending action locks,
  failed selection without a success refresh, creation trimming/failure retry,
  native input bounds, exact token/join-code/team payloads and live selection
  returning to the shared challenge.
- Two additional local-reference cases verify selection, creation, busy controls
  and both form variants with zero backend requests. The final strengthened
  journey walks from the start using native Tab/Shift+Tab, typing, Space and
  Enter; it passes on both viewports. The checkbox above the form is reached
  with native reverse Tab; the existing helper budget is unchanged.
- **Fourteen exact raw DOM, geometry, all-standard-computed-style and PNG
  comparisons** pass without class renames: ten player state/viewport cases
  (lobby, unassigned live, pending choice, pending creation and creation error)
  and four host cases (both team-form lobby steps at 1280/393px).
- All **210 stylesheet files** are byte-identical, with the same file set.
  **72 backend boundary, model and feature-controller modules** are byte-identical.
- The full suite passes **290 mocked browser cases**: 145 desktop and 145 mobile.
  The final keyboard-only reference strengthening was then rerun on both
  viewports; production source was unchanged. All **331 unit/component tests**,
  lint/formatting, strict TypeScript production build and Playwright type checks
  pass. Verification builds disable Sentry uploads.
- Source/documentation were frozen during browser jobs. All traffic used mocks;
  no live backend writes, deployment or schema changes occurred.

| Review slice                      | Purpose / scrutiny                                                                            | Proof                                                                                                        |
| --------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Regression fixtures and journeys  | Preserve team RPC arguments, capacity, locks, error recovery and refresh behavior             | Eight passing viewport cases against the original UI and after extraction; complete mocked suite             |
| Shared choice and form extraction | Reuse the native form across host/player and keep domain decisions in feature adapters        | Fourteen exact raw render comparisons; all 210 stylesheet files and 72 controller/boundary modules unchanged |
| Local references                  | Demonstrate selected/full/busy choices and both controlled forms without backend reads/writes | Two full native-keyboard journeys after strengthening; zero backend requests                                 |

The comparisons also confirmed an existing invisible team heading: white text
on a white card, with no shadow (contrast 1:1). It is recorded with the two
existing reward contrast findings for a separate accessibility slice. A
review-only proposal uses existing palette colors: team heading inherits
`#17102c` (18.31:1), award-points label uses `#23166e` on its existing pale
surface (14.21:1), and reward instruction copy uses white on its existing purple
surface (12.26:1). The latter two current ratios are 1.05:1 and 1.94:1.
Approval was requested under AGENTS.md's design-change rule and remains pending
at this checkpoint. No production colors changed. Proposal screenshots and
measurements are in `/tmp/chaos-crawl-contrast-review/` for this session.

Cumulative review load before this report: **511 files, +35,940 / -22,458
(58,398 lines)**. Reviewer pressure remains above the approximate 800-line budget.
Review regression additions, the raw markup extraction and local references as
separate slices using the map above.

## Phase 5d — owned team styling and shared primitives

Participant team selection now composes ContentPanel, PanelHeading, Overline and
CountBadge choice variants, spaced CandidateList and shared Button team-create.
ChoiceOption owns its BEM block and composes Avatar through a choice variant
that preserves the legacy 37px initial marker. TeamNameForm's owned block supplies lobby and participant
variants; the prior team-create-form partial is retired. Local team references
compose these same primitives and the catalog documents their contracts.

The player card, selected/full choices, native input and submit control retain
their existing appearance. Existing colors/font values were promoted or reused;
there is no palette redesign. The old heading contrast defect remains pending
its separate approval request. Capacity, membership, trimming, busy behavior,
placeholder projection, callbacks and commands remain with the existing callers.

Removed **17 migrated PlayerGame selector arms** while retaining **341** with
identical order, conditions and declarations. Generic player heading, eyebrow
and count rules retain their other callers and were not retired in this slice.
The other four legacy stylesheets are byte-identical. All **1,300 previous
expanded SCSS projections** remain unchanged in order after the two explicit
lobby form selector renames. Both feature coordinators, the host team-form adapter
and **72 backend/model/controller modules** are byte-identical.

The boundary comparison caught an implementation error before completion: the
new styles initially used the project's 520px small-screen token, but the original
team rules switch at **480px**. The migration now promotes that original value
to the player compact breakpoint. Both the actual 480/481px boundary and the
520/521px pair were checked after correction; the full state comparisons were
rerun against the corrected source.

Verification completed with source/documentation frozen during browser jobs:

- **42 exact render comparisons** pass. Fourteen full-page cases cover player
  lobby/live, pending choice/creation, creation errors and both host lobby form
  steps at desktop/mobile widths. Four more full-page cases check 480, 481, 520
  and 521px. Twenty-four control cases cover selected/unselected/full choices,
  enabled/disabled submit controls and native inputs through focus, hover,
  keyboard-active and mouse-focus states at 1280/393px.
- Comparisons check native DOM/attribute/text values, geometry, every standard
  computed property in the captured subtree and exact PNG bytes. Only the explicit
  class additions/renames are normalized; the property/state checks are not
  inferred from default screenshots.
- The complete mocked suite passes **290 browser cases**: 145 desktop and 145
  mobile. All **331 unit/component tests**, lint/formatting, strict TypeScript
  production build and Playwright type checks pass. Sentry uploads were disabled.
- No live backend writes, schema changes, deployment or new dependencies occurred.
  Owned test servers ended cleanly after both browser projects completed.

| Review slice                      | Purpose / scrutiny                                                                                             | Proof                                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Team view composition             | Share panels, typography/counts, avatar, candidate layout and submit control while callers retain domain rules | Fourteen exact state/form render comparisons, unchanged coordinators/controllers and team command regressions           |
| Owned form/choice styles          | Retire legacy selectors and preserve host/player form variants                                                 | Retained selector manifest, 1,300 unchanged expanded projections and exact renders                                      |
| Responsive and interaction states | Preserve the original compact boundary and native control behavior                                             | Four boundary cases plus 24 exact focus/hover/active/disabled/input cases; full keyboard journeys in the 290-case suite |
| Local contract                    | Show new shared variants with local state only                                                                 | Updated examples/catalog; backend-free selection/creation/busy tests on both viewports                                  |

Cumulative review load before this report: **512 files, +36,237 / -22,543
(58,780 lines)**. Reviewer pressure remains above the approximate 800-line budget;
review this styling/composition slice separately from the prior raw extraction
and regression additions. Use the map above to distinguish mechanical CSS work
from control/responsive behavior that deserves scrutiny.

## Phase 5e — private-mission native dialog and regressions

PrivateMissionDialog now composes the shared native Dialog with its visible
heading and description linked by ID. Play remains the only acknowledgement:
Escape and backdrop clicks cannot accept or dismiss a mission. The participant
controller still owns ordering, phase visibility, acknowledgement and the
separate seen/dismissed storage keys. The local styleguide example uses state
only and demonstrates native keyboard acceptance and opener restoration.

This is an intentional accessibility behavior slice. The browser top layer now
inerts the page and dims/covers its navigation; the old fixed overlay allowed
navigation to paint above the backdrop. Initial focus goes to Play, Tab stays
inside, and unmounting for secret review closes the dialog without acknowledging
it. An already-open player tour regains focus after Play. Neither production
styles nor backend/controller behavior changed in this slice.

Verification:

- The complete mocked suite passes **310 browser cases**, 155 desktop and 155
  mobile. All **331 unit/component tests**, lint/formatting, strict TypeScript
  production build and Playwright type checks pass. Verification builds disabled
  Sentry uploads; no live backend writes or schema changes occurred. Both owned
  browser projects and their test server terminated cleanly.
- Seven functional cases per viewport passed against the original announcement
  before the modal move. Ten cases per viewport now cover multiple missions,
  explicit acceptance, reload/navigation, unavailable or malformed storage,
  reward/review precedence, completed-card dismissal, native focus/text selection,
  tour stacking and the local styleguide.
- All 211 stylesheet files and both host/player coordinators remain byte-identical
  to the prior checkpoint. The 34 existing .ts files under host-live/session-player
  also remain byte-identical.
- Ten desktop/mobile panel comparisons cover focus, hover, keyboard-active,
  long-copy and zero-point cases. Inner native markup matches after normalizing
  only the four ARIA attributes moved to the dialog. Geometry matches. Computed
  styles match except the verified Chromium user-agent user-select reset from
  auto to text; physical selection remains tested.
- Nine panel PNG pairs are byte-identical. The mobile keyboard-active pair has
  56 differing rounded-corner pixels (maximum channel delta 16), with no changes
  outside the corner paint band. Full viewport screenshots intentionally differ
  because native modality now covers/inerts the navigation. This is not a claim
  of full viewport visual parity.

| Review slice                | Scrutiny                                                                                       | Proof                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Receipt and acknowledgement | Ordering, persistence failures, phase precedence and separate dismissal                        | Original-before-move regressions and mocked production journeys                    |
| Native dialog integration   | Focus containment, inert page, explicit acceptance, phase cleanup and stacked-tour restoration | Desktop/mobile keyboard and selection journeys; unchanged controllers              |
| Panel appearance            | Existing body and interaction geometry                                                         | Ten computed/DOM comparisons, nine exact PNGs and bounded corner raster difference |
| Local contract              | No storage or backend work in the example                                                      | Controlled local example and intercepted-network assertions                        |

Cumulative review load before the final report note: **515 files, +36,914 /
-22,543 (59,457 lines)**. This exceeds the approximate 800-line review budget.
Review the receipt regressions, native accessibility behavior and local example
as separate slices using the map above; the retained styling is unchanged.

The next slice moves the retained announcement body/frame classes into owned
SCSS and shared presentation primitives. Preserve the explicit Play contract and
native modal lifecycle; do not combine this with the pending contrast redesign.

## Phase 5f — owned announcement styling and shared reveal primitives

PrivateMissionDialog now composes reveal variants of Dialog, DialogPanel,
PanelHeading, Badge, IconBadge, Overline and Button. Native tags, heading and
description IDs, copy and explicit Play callbacks are retained. The controlled
local example and component catalog document the variants without connecting
to backend or storage. Nineteen announcement rules were retired from
PlayerGame.css; no announcement classes remain in production markup.

The existing scrim and points colors, width and text-outline measurements are
promoted to project tokens without a palette change. The small outlined display
type fragment is shared by the label and heading; component declarations remain
in their owned partials. Query, timer, submission, storage and phase coordination
remain in the existing feature controllers.

Verification completed with source/documentation frozen during browser jobs:
**310 browser cases** pass (155 desktop and 155 mobile), alongside all **331
unit/component tests**, lint/formatting, the strict TypeScript production build
and Playwright type checks. Sentry uploads were disabled. No live backend writes,
new dependencies, schema changes or deployment occurred.

Mechanical evidence:

- All 322 retained player selector arms preserve their order, conditions and
  declarations. The other four legacy stylesheet sources are byte-identical.
  All 1,319 prior expanded SCSS rule projections remain an identical ordered
  subsequence; new rules are restricted to explicit reveal variants.
- Ten desktop/mobile render comparisons cover focus, hover, keyboard-active,
  long copy and zero points at 1280/393px. They compare the entire native dialog:
  DOM/attributes after seven explicit class replacements, all geometry, every
  standard computed property, byte-exact panel PNGs and byte-exact viewport PNGs.
  No native selection reset, ARIA or style normalization is needed in this slice.
- Four additional inline-host comparisons cover focus and keyboard-active states
  at both widths. Their final captures match DOM, geometry, computed styles and
  both PNGs exactly. An earlier desktop-active capture differed only in 53 panel
  and 57 viewport pixels, all within rounded panel/focus-outline corners, with
  maximum channel differences of 16 and 14 respectively. Repeating with unchanged
  source yielded exact PNGs; record this bounded raster variability rather than
  claiming every host capture was byte-identical.
- Both session coordinators remain byte-identical to the native-dialog checkpoint.

| Review slice       | Scrutiny                                                    | Proof                                                           |
| ------------------ | ----------------------------------------------------------- | --------------------------------------------------------------- |
| Shared composition | Native tags, callback wiring and explicit variant selection | Normalized full-dialog DOM and command/keyboard regressions     |
| Owned SCSS         | Cascade, token values and responsive/interaction states     | Retained selector/rule projections and exact render comparisons |
| Local contract     | Presentation-only examples and accurate component notes     | Backend-free preview regression and catalog updates             |

This source slice changes 24 files, +191/-189 raw lines before documentation.
Review the shared variant declarations separately from the native-dialog behavior
slice above; callbacks, storage and phase coordination are unchanged here.

Cumulative review load before this final report note: **516 files, +37,528 /
-23,103 (60,631 lines)**. Reviewer pressure remains above the approximate
800-line budget. The phase map separates mechanical styles, shared composition
and the previously verified native accessibility behavior.

## Phase 5g — join/rejoin regressions and controlled access views

Join now adapts URL code/entry mode and the successful redirect to PlayerAccess.
usePlayerAccess owns form steps, values, validation, pending state, feedback and
credential storage. PlayerAccessView and PlayerDetailsFields are controlled
presentation; shared GameCodeInput owns the six-digit native input and decorative
cells. The local reference uses its own state and never mounts the connected
controller. Its section root avoids nesting a main landmark in the styleguide.

The typed SDK access function in lib/playerAccess.ts preserves the original RPC
payload and SDK error objects. The existing feedback distinguishes Error instances
from plain database errors, so normalization is deliberately outside this neutral
extraction. Its JoinResult is a frontend consumption contract, not a generated or
verified deployed schema. The original broad component assertion is removed.

Verification completed with source/documentation frozen during browser jobs:
**330 mocked browser cases** pass, 165 desktop and 165 mobile, alongside all
**331 unit/component tests**, lint/formatting, strict TypeScript production build
and Playwright type checks. The interrupted run exposed the keyboard helper cap;
its correction was followed by a clean full run. Sentry uploads were disabled;
no live backend writes, schema changes, new dependencies or deployments occurred.

Evidence:

- Nine production journeys passed on desktop/mobile before extraction, covering
  URL/input filtering, native bounds and Back retention, trimmed payloads, isolated
  V2 credentials, replaced history/welcomeBack state, name-free rejoin, failed
  retries/mode changes, pending editable fields, incomplete responses, storage
  failure and query-code hydration with entry-only mode selection.
- Those nine cases plus the backend-free local form reference pass after extraction
  on both viewports. The local test uses native keyboard traversal/acceptance,
  toggles pending state and checks that no credentials or backend requests exist.
- The full run exposed the keyboard helper's fixed 160-Tab cap after adding a
  styleguide example. Its bound now derives from the page's potential controls;
  it still traverses native Tab/Shift+Tab and verifies the requested focus target.
  The previously failing local review journey passes on both viewports. No
  scripted focus, disabled checks or suppressed assertions were introduced.
- All 212 stylesheet files are byte-identical to the prior checkpoint. Twenty
  raw render comparisons at 1280/393px cover empty/filled code, empty/valid join
  details, rejoin code/details, failed/pending submission and explicit hover/active
  states. Native DOM, attributes, input values, geometry and every standard
  computed property match without class or attribute normalization.
- Sixteen final viewport PNG pairs are byte-identical. The four error/active pairs
  differ by 4–5 pixels each, maximum channel delta 3, in narrow field/control edge
  regions. The raw differences are retained; this is not a claim that every PNG
  was byte-identical. The baseline assets were copied rather than symlinked so
  Vite development URLs match without normalizing the rendered markup.

| Review slice                     | Purpose / scrutiny                                                             | Evidence                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Regression additions             | Native validation, payload/storage/history contracts, pending/failure recovery | Original-route baseline and post-extraction desktop/mobile journeys         |
| Route/controller separation      | Entry-only mode, query code hydration, storage and successful redirect         | Raw rendered DOM parity and unchanged payload/feedback assertions           |
| Controlled presentation          | Native tags, labels, IDs, values and callbacks                                 | Twenty DOM/computed comparisons and recorded screenshot deltas              |
| SDK boundary and local reference | Preserve SDK error semantics; never connect local demos                        | Failed/incomplete/storage regressions and zero-network/local-storage checks |

The source slice is 14 files, +888/-270 raw lines before configuration and
report changes, above the approximate 800-line review budget. Review the regression
additions separately from the mechanical component moves and access typing.
The broader cumulative refactor remains substantially above that budget.

The original pending-join completion remains for a separate lifecycle slice:
late responses can still complete storage/navigation after the user leaves or
changes the target code. Add regression coverage for that behavior before fixing
it; do not claim this neutral extraction solved cancellation or stale commands.
Follow with owned join styles and the remaining player demo/V2/legacy migration.

Cumulative review load before this final report note: **527 files, +38,467 /
-23,368 (61,835 lines)**. Reviewer pressure remains high. Use the phase maps to
review regressions, structural extraction, styling and intentional accessibility
behavior separately. The local checkpoint preserves the verified state; it does
not mark the full refactor complete.

## Phase 5h — pending join identity and lifetime

usePlayerAccess now scopes completion to the mounted form and its target code/
mode generation. Leaving, changing the query or local code, changing join mode,
or changing away and back invalidates the old completion. A stale success cannot
store credentials or redirect; a stale failure cannot log or display feedback.
The form unlocks after its outstanding request settles. A synchronous pending
lock also prevents repeated same-frame submissions from starting two RPCs.
Name/mobile edits retain their existing pending contract and do not invalidate a
current join. An old unmounted instance cannot unlock or authorize a new one.

This is a separate intentional lifecycle fix. It does not abort or undo the
server request. RPC payloads, SDK error handling for current requests, validation,
native controls, storage keys and successful history state remain unchanged.

Verification:

- Twelve focused component regressions exercised the connected access feature
  with deferred SDK replies. Before the guard, eleven fail and the ordinary
  editable-fields success passes. All twelve now pass, including StrictMode,
  unmount/remount, stale success/database/transport failure, changed query/local
  code and mode, away-and-back identity, synchronous locking and a fresh join
  after an obsolete request settles.
- All **343 unit/component tests**, lint/formatting, strict TypeScript production
  build and Playwright type checks pass. Sentry uploads were disabled. Build
  caught unsupported Testing Library role-query options in the new test file;
  they were corrected without relaxing the assertions.
- All **26 affected browser cases** pass, thirteen desktop and thirteen mobile.
  The three new journeys verify leaving the form and changed-query success/error
  using held mocked responses; existing join/rejoin, storage failure, pending
  edits, history and local-preview journeys also pass. Source and documentation
  were frozen during browser jobs. Other browser workflows last passed in the
  complete 330-case run at checkpoint ceb45f5; that complete suite was not rerun
  for this feature-only lifecycle slice.
- All 212 stylesheet sources, the three existing access component modules,
  GameCodeInput, the route adapter, consumed response contract and SDK access
  boundary remain byte-identical to ceb45f5. No markup, colors, backend payloads,
  live writes, migrations, dependencies or deployment changed.

| Review slice          | Intent / scrutiny                                                                | Proof                                                                                |
| --------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Completion ownership  | Reject stale credentials, navigation and feedback without cancelling server work | Deferred replies before/after; unmount/remount and identity round-trip cases         |
| Pending action lock   | Avoid duplicate RPCs while preserving editable fields and later recovery         | Same-frame double-submit regression; ordinary pending success and fresh-target retry |
| Browser integration   | Keep the chosen route/code and recover current controls after stale completion   | Twenty-six affected desktop/mobile journeys with intercepted backend traffic         |
| Presentation boundary | Preserve existing appearance and access contracts                                | Unchanged stylesheet/component/adapter/SDK bytes and existing join journeys          |

The next phase migrates retained join CSS into owned SCSS and shared form/control
appearances with raw DOM, computed-style and screenshot comparisons. Keep that
styling move separate from this lifecycle behavior change. The full refactor and
final desloppify audit remain outstanding.

## Phase 5i — owned join styling and shared access primitives

The join view now composes shared AccessHeader, DisplayHeading access, Note
access-intro/help, MascotArt, FloatingNotice, FormStack, ContentPanel access-field,
FormLabel/InputIcon access and Button access/back/switch variants. GameCodeInput
owns its BEM label/cells/control styles. Native tags, labels, IDs, control types,
copy, callbacks and error announcement semantics are retained. Title/intro/submit
copy is derived before JSX rather than through nested render ternaries.

All 73 remaining join selector arms were retired from PlayerGame.css, including
historical overrides and the obsolete CSS-drawn mascot. Effective declaration
values were consolidated into owned component partials and the player-access
route shell. Existing colors, font stacks and measurements were promoted to
project tokens; this is not a palette redesign. The shared player gradient arm
and legacy root aliases remain for their other consumers. The retained legacy
spinner still has multiple callers, so the access coordinator keeps its existing
legacy stylesheet import until that separate migration.

Verification completed with source/documentation frozen during browser jobs:

- **343 unit/component tests**, lint/formatting, strict TypeScript production
  build and Playwright type checks pass. MascotArt requires an explicit alt string
  at the type boundary; the tested rendered image markup is unchanged.
- All **26 affected browser cases** pass on desktop/mobile. They retain normal
  join/rejoin, validation, pending edits, errors, storage/history and stale-result
  behavior. The local reference also toggles its sample error by keyboard, renders
  the shared floating notice and still performs no backend or credential work.
  Other browser workflows last passed in the preceding complete 330-case run;
  this styling slice reran the affected join journeys rather than that full suite.
- A compiled-rule manifest proves all **249 retained player selector arms** keep
  their exact order, conditions and declarations. The four other legacy
  stylesheet sources remain byte-identical. All **1,329 previous expanded SCSS
  rule projections** remain an identical ordered subsequence.
- **50 render comparisons** match native DOM/attributes/input values after only
  explicit class replacements/additions, geometry and every standard computed
  property. Twenty main cases cover both steps, join/rejoin, error/pending and
  primary hover/active states at 1280/393px. Four check code focus/selection;
  sixteen check 599/600px widths and 739/740/741px heights; two check reduced
  motion; eight check back/switch hover and keyboard-focus presentation.
- Thirty-six final viewport PNG pairs are byte-identical. Fourteen differ by at
  most seven pixels, maximum channel delta 3, in narrow field/control edge
  regions. Raw differences are retained; no image or computed-style tolerance
  masks were applied. This is not a claim that every PNG was byte-identical.
- The original 600px-width padding and 740px-height join overrides were already
  shadowed by later unconditional declarations. The new shell preserves those
  effective values; comparisons check both sides instead of reinstating the old
  ineffective rules. Query/state controllers, access contracts, SDK payloads and
  route adapter remain byte-identical to c22b9f8.

No live backend writes, migrations, dependencies, Sentry uploads or deployment
occurred. Local demos remain disconnected from the access controller.

| Review slice                      | Purpose / scrutiny                                                                  | Proof                                                                                           |
| --------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Retired CSS and tokens            | Consolidate effective values without changing other player or host rules            | Retained selector manifest, ordered expanded SCSS projections and fifty render comparisons      |
| Shared primitive APIs             | Preserve default behavior and explicit native props while adding access appearances | Existing rule projections unchanged; all unit/component tests and strict build                  |
| Access view composition           | Native tags, labels, IDs, values and callbacks; class ownership                     | Normalized DOM/computed parity, unchanged controller/SDK/adapter bytes and affected journeys    |
| State and responsive presentation | Pending/error/focus/hover/active, reduced motion and old thresholds                 | Explicit interaction/boundary comparisons, recorded PNG deltas and keyboard journeys            |
| Local contract                    | Demonstrate shared controls and both notice tones without connecting                | Existing local submit/pending checks plus the new error toggle; zero backend/storage assertions |

This slice exceeds the approximate 800-line review budget. Review the mechanical
CSS/token move separately from shared API/composition and local-reference changes;
use the table to distinguish source movement from native-prop scrutiny. The next
phase covers player-demo regressions and reuse while preserving its local-only
behavior and tour targets, then continues through remaining V2 and legacy work.

## Phase 5j — player-demo regressions and local controller boundary

PlayerDemo now adapts the public route to PlayerDemoExperience. The coordinator
owns the existing tour content and composes usePlayerDemo with controlled
PlayerDemoView. Local page, tour and sample-selection state has a typed feature
model; tour navigation narrows the supported page values instead of asserting a
string into the page union. No live session controller is mounted.

This checkpoint preserves the older demo appearance and markup. Shared-layout
conversion remains outstanding: the demo differs visibly from the current
host/player SessionPage. An asynchronous user choice was requested under
AGENTS.md's rule, "New colors or intentional design changes require user input."
No answer has been received, and automatic goal continuation is not approval.
Do not manufacture parallel shared widgets from the retained legacy view while
that choice is pending. The neutral controller and regressions support either
approved layout direction.

Verification, with source/documentation frozen during browser jobs:

- Six production journeys per viewport pass against the original route before
  extraction and again afterward: **12 affected browser cases**. They cover
  keyboard navigation across all pages and static scores, separate complete/
  challenge/vote actions, local native file selection, reload reset, sample-state
  retention across navigation/restarted tours, all seven visible tour targets,
  modal dismissal/highlight cleanup and restart-trigger focus restoration.
- Every journey asserts the demo URL remains local, localStorage stays empty,
  and the intercepted backend receives no requests. File selection uses the
  existing local logo asset; it is not uploaded or persisted.
- All **343 unit/component tests**, lint/formatting, strict TypeScript production
  build and Playwright type checks pass. Sentry uploads were disabled. Other
  workflows last passed in the complete 330-case run at the earlier checkpoint;
  this local-only extraction reran the affected demo journeys.
- All **218 stylesheet files** remain byte-identical. Twelve before/after render
  comparisons at 1280/393px cover initial tour, game, selected sample, scores,
  challenges and final. Raw app and tour DOM/attributes, geometry and every
  standard computed property match with no class/attribute normalization.
- Eleven final viewport PNG pairs are byte-identical. One mobile sample pair
  differs by two pixels, maximum channel delta 2, at a narrow control edge. The
  raw delta is retained; this is not a claim that every PNG was byte-identical.

| Review slice             | Purpose / scrutiny                                                       | Proof                                                                                              |
| ------------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Behavioral regressions   | Preserve native/local sample actions and complete tour paths             | Original-route and post-extraction keyboard/file-chooser journeys; zero backend/storage assertions |
| Route and state boundary | Keep page orchestration thin and local state explicitly typed            | Strict build, unchanged interaction outcomes and reload/navigation checks                          |
| Retained presentation    | Move existing markup without redesign or new duplicate primitives        | Twelve raw DOM/computed comparisons, unchanged stylesheets and recorded PNG delta                  |
| Tour composition         | Preserve content, page changes, highlight cleanup and native modal focus | All seven targets traversed by keyboard on both viewports; raw tour DOM parity                     |
| Pending layout choice    | Keep local display reusable without silently choosing a visual redesign  | Accurate catalog/guidance; existing view retained until user input                                 |

The source slice is above the approximate 800-line review budget, predominantly
moved markup plus regression additions. Review the tests separately from the
mechanical view move and small controller/route wiring; visual unification is
explicitly not included in this checkpoint. While the design choice is pending,
continue independent HostSaved regression/boundary work, then remaining host/V2,
legacy, styling retirement and the final desloppify audit.

## Phase 5k — saved-item feature, API and read-lifetime boundaries

HostSaved now composes SavedItemsWorkspace. useSavedItems owns the collection,
filter, loading and feedback; controlled SavedItemsView/SavedItemCard implement
presentation. Typed hostSavedQueries/hostSavedCommands use runApi and the existing
SDK/auth access functions. The frontend HostSavedItem contract replaces broad
component assertions; it is an inferred consumption shape, not deployed schema.
Title/name/fallback precedence, optional descriptions/stops, zero-point display,
server-provided order and native remove labels remain intact.

The presentation move is neutral. The read controller also deliberately fixes an
obsolete-effect issue found during extraction: a late identity lookup previously
started another query after unmount or StrictMode cleanup, and a stale read
failure could replace removal feedback. Effect-local cleanup guards now reject
obsolete identity/query results. Command outcomes check mount lifetime; query
and action feedback have separate state. Server requests already issued are not
cancelled or undone. Pending remove controls retain their existing enabled state.

Verification, with source/documentation frozen during browser jobs:

- Seven saved-route journeys per viewport pass before extraction and afterward,
  covering exact host filter/select/order, incoming order and fallbacks, native
  filters, pending reads/filter retention, pending and failed/retried deletion,
  missing identity, query failure and empty collections. Deletes retain the exact
  id-only filter and empty body. Client filters are not proof of server policy.
- The local reference uses only state and controlled views inside HostPatternPreview.
  Its additional keyboard journey filters/removes sample rows and toggles loading
  with zero backend requests. All **16 affected browser cases** pass, eight per
  viewport; no connected workspace is mounted by the reference.
- Three lifecycle regressions fail before the guards and pass afterward. They
  prove an unmounted identity response cannot start a query, only the current
  StrictMode effect reads rows, and an obsolete identity/read cannot erase a
  failed removal. All **346 unit/component tests** pass.
- Lint/formatting, strict TypeScript production build and Playwright type checks
  pass. Sentry uploads were disabled. No live backend writes, migrations, new
  dependencies or deployment occurred. Other workflows last passed in the earlier
  full 330-case browser run; this feature slice reran its affected journeys.
- All **218 stylesheet files** remain byte-identical. **20 render comparisons**
  at 1280/393px cover all/task/location/route filters, empty data, read/identity
  errors, pending loading, failed deletion and successful deletion. Raw DOM,
  attributes, geometry and every standard computed property match without
  normalization; every final viewport PNG pair is byte-identical. The mobile
  verifier waits for the settled account text in the DOM because that text is
  intentionally hidden at narrow widths; no production readiness code changed.

| Review slice            | Intent / scrutiny                                                            | Proof                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Feature/view extraction | Native markup, labels, callback wiring, filtering and fallback copy          | Fourteen original-route regressions and twenty exact DOM/style/PNG comparisons           |
| Persistence boundary    | Preserve host-scoped read/order and id-only delete; use standard API results | Actual mocked SDK request URL/body assertions, failure/retry and strict build            |
| Read ownership          | Reject obsolete effect results and protect action feedback                   | Three before-failing/after-passing lifecycle regressions; current browser flows retained |
| Local contract          | Reuse controlled collection/card presentation without connecting             | Local keyboard selection/removal/loading journey with zero backend requests              |
| Test support            | Permit only the existing saved-row DELETE shape in the shared mock           | Precise id-filter handling and request-contract assertions; other endpoints unchanged    |

This slice exceeds the approximate 800-line review budget. Review regression/test
support additions separately from view movement, typed persistence and the small
intentional lifecycle fix. Styling and accessibility behavior changes are not
part of this checkpoint. Continue with owned saved-item styles and shared
furniture, then remaining host/V2/legacy work and the final desloppify audit.
The player-demo visual choice and previously recorded contrast choices remain
pending; continue independent work without inferring approval.

## Phase 5l — saved-item shared primitives and owned styling

SavedItemsView now composes FilterGroup, Button/CountBadge filter, PanelGrid
collection, ContentPanel workspace-error and EmptyState workspace. SavedItemCard
composes ContentPanel entity, IconBadge entity, Overline workspace and Badge
entity; its owned block contains only card arrangement and copy. IconButton
entity-remove replaces the old saved-card-dependent border selector with an
explicit appearance. The shared workspace-surface fragment supplies the recurring
feedback/empty frame. New tokens promote existing literal values; no palette or
intentional appearance change was introduced.

Native tags, text, attributes, filter selection, points including zero, removal
callbacks and pending/error semantics are retained. Persistence/controllers are
unchanged. The local reference demonstrates the shared views, filtering/removal,
loading and error states without backend access. Legacy host rules still used by
other screens remain until their consumers migrate.

Verification with source/documentation frozen during browser jobs:

- All **346 unit/component tests**, lint/formatting, strict production build and
  Playwright type checks pass. Sentry uploads were disabled.
- All **16 saved-item browser cases** pass on desktop/mobile. The local keyboard
  journey now also toggles error feedback, retaining zero backend requests.
- **32 render comparisons** cover ten collection/loading/error/deletion states
  at 1280/393px, keyboard focus/hover/pressed controls, and both 850/851px grid
  boundaries. DOM (normalizing only explicit class replacements), geometry and
  every standard computed property match. Thirty PNG pairs are pixel-exact;
  two desktop focus pairs differ by 19/26 pixels, maximum channel delta 4/6,
  with no masks or ignored regions. This is recorded raster variation, not a
  claim of exact screenshots for those two cases.
- Expanded CSS proof retires **12 saved-only legacy selector arms**. The other
  **73 retained HostPortal/HostTheme arms** preserve exact conditions, order and
  declarations; the other three legacy stylesheets remain byte-identical.
  All **1,369 prior expanded SCSS projections** retain their declarations and
  order after the one explicit remove-button selector replacement.
- No live backend writes, schema migrations, new dependencies or deployment.
  Other journeys last passed in the earlier full 330-case browser run; the
  whole-goal final browser run remains required.

Continue with HostExplore regression coverage before separating its catalogue
models, persistence/controllers and presentation. Its current route is roughly
1,900 lines; split boundary moves and styling into reviewable checkpoints rather
than combining the whole conversion.

## Phase 5m — HostExplore regression baseline

Nine browser journeys now run against the unchanged HostExplore route on desktop
and mobile: **18 passing cases**. They cover host-scoped favourites and ordered
community reads; approved/public versus own pending/rejected visibility; native
search, category and tab interactions; location disclosures and route outlines;
task/venue/route saves; pending save controls and failed deletion/retry; creation
bounds, eight-tag limits and trimmed submission payloads; admin approval/rejection
and retry; approved editing and cancelled/confirmed deletion; and built-in,
community and venue imports into the planning route.

Assertions inspect actual mocked SDK request bodies and query strings, including
separate item types, id/status filters, reviewer identity/time and selected-tag
insertion order. The isolated Explore helper reuses the existing session backend;
only explicitly expected community writes are fulfilled by their individual
tests. Unexpected backend operations still fail verification. The import journey
waits for the lazy planning destination to mount before returning, rather than
mistaking a changed URL for a completed transition. Native combobox names identify
select controls; no production labels or behavior changed to satisfy the tests.

Application source, styles and dependency manifests remain identical to a83683b,
whose 346 unit/component tests and production build passed. New Playwright types,
lint/formatting and all eighteen affected browser cases pass. Source/documentation
were frozen during each browser run; all traffic was mocked, with no live writes.
This checkpoint establishes a behavioral baseline; extraction and rendered parity
proof are still required in the following slices. Existing modal focus/dismissal
and tab arrow-key concerns remain separate accessibility work, not silently fixed
or asserted accessible by these regressions.

The regression checkpoint is near/above the approximate 800-line review budget.
Review it separately from the upcoming route extraction:

| Review slice                 | Scrutiny                                                           | Evidence                                                                    |
| ---------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Browsing and favourites      | Filtering, pending state, exact saved-item payloads and retry      | First three journeys, both viewports                                        |
| Contributions and moderation | Form bounds, tags/order, status filters, cancellation and feedback | Creation/approve/reject/edit/delete journeys                                |
| Import integration           | Built-in JSON versus community ID versus venue ID query contracts  | Native action through settled planning destination                          |
| Test support                 | Local records, captured requests and narrowly fulfilled writes     | No application changes; existing unexpected-operation verification retained |

Continue with catalogue contracts/data and focused persistence/controller/view
boundaries, preserving this baseline before separately migrating styling.

## Phase 5n — HostExplore catalogue and draft models

Built-in task/location/route records and tag choices now live in the feature's
catalogue module. Feature-only types stay in features/host-explore/types.ts;
inferred community/favourite consumption contracts live in types/hostExplore.ts
for the upcoming persistence boundary. No deployed schema or authorization claim
is implied by those interfaces.

catalogueModel owns approved-challenge projection, ordered tab categories and
unsorted search/category filtering. challengeDraft owns independent fresh drafts,
persisted editor hydration and the existing bounded command payload. Public and
editor defaults remain distinct: optional public zero durations become absent,
editor zeros remain, public tags have no editor cap, editor tags cap at eight,
and their missing-tag defaults differ. Existing selected-tag insertion order is
preserved. Explicit return contracts replace the moved literal/type assertions.
The route still owns its original queries, commands and presentation pending the
next focused slices; this checkpoint does not claim those layers are complete.

Verification with source/documentation frozen throughout browser jobs:

- All **354 unit/component tests** pass, including eight new domain regressions
  for publication visibility/order, zero/default distinctions, tag hydration,
  independent drafts, numeric bounds and searches across catalogue fields.
- Lint/formatting, strict production build and Playwright type checks pass.
  Verification builds disabled Sentry uploads. All **18 affected desktop/mobile
  browser cases** pass again after extraction, including writes and imports.
- **24 desktop/mobile render comparisons** cover the full catalogue, search,
  categories/no matches, locations/details, routes/outlines, create/edit forms,
  moderation queue and favourites errors. Raw DOM/attributes, geometry, every
  standard computed property and viewport PNGs match exactly, with no class
  normalization, masks or ignored regions.
- Mechanical comparison against the captured route proves every built-in record
  and tag choice identical. **561 filter comparisons**, **30 editor projections**
  and **40 bounded payload comparisons** match original expressions, preserving
  full values/order, undefined and NaN distinctions. Initial draft values match.
- Route JSX and its existing PlusIcon remain byte-identical. The entire route
  coordinator AST matches after normalizing only six extracted initializers,
  payload projection, two draft calls and equivalent favourite type spelling.
  All five memo dependency arrays remain byte-identical; persistence payloads,
  ordering and feedback logic remain in the original coordinator.
- All **221 stylesheet files** remain byte-identical. No new dependency, live
  backend write, migration or deployment occurred. The complete final browser
  run and desloppify audit remain outstanding for the full refactor goal.

This slice exceeds the approximate 800-line review budget, mostly because data
and existing rules moved between files. Review it in these slices:

| Review slice            | What changed / scrutiny                                                            | Mechanical evidence                                                     |
| ----------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Catalogue and contracts | Static records moved; distinguish feature types from inferred database consumption | Complete record/order comparison and strict build                       |
| Public/editor models    | Preserve approval guard, fallback/zero/tag rules and payload bounds                | Original-expression comparisons plus eight domain regressions           |
| Route wiring            | Replace inline projections/defaults with named model calls; retain coordination    | Coordinator AST, unchanged dependency arrays and eighteen browser cases |
| Presentation            | No markup or styling conversion in this checkpoint                                 | Byte-identical JSX/styles; twenty-four exact DOM/style/PNG pairs        |

Continue with typed persistence commands/queries, then focused controllers and
controlled views. Keep lifecycle/error-behavior fixes and styling migration in
separate explicitly verified slices.

## Phase 5o — HostExplore typed persistence boundary

hostExploreQueries owns the existing narrow host-favourites read and ordered
community read. hostExploreCommands owns favourite insertion, new contribution,
approved edit/delete and pending review commands. Shared hostAuth identity,
hostHubQueries admin checks and hostSavedCommands removal replace equivalent
inline SDK calls. No direct Supabase calls remain in HostExplore. Domain values
and query results have explicit frontend contracts; they are not deployed schema
validation or proof of server policy. UI trimming, confirmation, timestamps,
feedback, busy state, refresh decisions and navigation remain in the coordinator.

The favourite adapter returns a plain metadata record; the SDK's JSON serializer
preserves the original stored request body, including omitted undefined values
and non-finite numeric conversion, without a broad JSON/response assertion.
Shared CommunityChallengePayload supplies the command contract and corresponding
feature kind/equipment types. Query/command extraction retains the existing
filters, field selections, single-row response mode and multi-step ordering.

This slice intentionally standardizes **database exception recovery** through the
existing runApi helper. Synchronous builder throws and rejected SDK promises now
return ordinary errors and are reported through existing monitoring. A component
regression fails against the original route with an unhandled save exception and
no recovery feedback; it passes after extraction, proving visible feedback,
released busy state and successful retry. Auth retains its existing SDK contract;
this is not a claim that every auth/lifecycle failure has been fixed.

Verification with source/documentation frozen during browser jobs:

- All **358 unit/component tests**, lint/formatting, strict production build and
  Playwright type checks pass. New regressions cover synchronous/rejected failures
  across all seven new read/write functions, saved metadata JSON behavior and
  route save recovery. Sentry uploads were disabled.
- All **18 existing desktop/mobile catalogue journeys** pass after extraction,
  including native interactions, exact payload/status filters, failures/retry,
  moderation, confirmed/cancelled deletion and the planning imports.
- **20 before/after comparisons** at 1280/393px cover initial/error reads and
  completed/failed favourite saves, removal, contribution creation/failure, edits,
  approval and rejection. SDK methods, URLs, Accept headers and bodies match.
  Independent mount GETs are compared as a multiset (StrictMode retains both
  copies); subsequent command/reload order remains strict. Raw traces are kept;
  no write is reordered or omitted from the comparison.
- For those same twenty states, raw DOM/attributes, geometry, every standard
  computed property and viewport PNGs match exactly without normalization or
  masks. JSX and the existing PlusIcon remain byte-identical. All **221 stylesheet
  files** remain byte-identical; the shared auth SDK/client files are unchanged.
- **39 complete metadata JSON bodies** match the old round-trip serialization,
  covering all built-in records and community optional/non-finite cases.
  No dependencies, live backend writes, migrations or deployment were introduced.

| Review slice       | Scrutiny                                                                              | Evidence                                                                 |
| ------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Typed persistence  | Exact selected fields, DTO mapping, id/status guards and single-row response contract | Eighteen SDK journeys and twenty before/after traces                     |
| Coordinator wiring | Preserve UI decisions, confirmations and reload order; recover database exceptions    | Before-failing save regression, all unit gates, ordered post-read traces |
| Metadata adapter   | Preserve stored JSON despite removing the broad assertion                             | Thirty-nine full-body comparisons and edge-case regression               |
| Presentation       | No markup, styling or accessibility conversion                                        | Twenty exact DOM/style/PNG pairs and identical source markup/styles      |

Next: focused favourites/community/contribution/moderation controllers and
controlled feature views. Query lifetime, command/query feedback separation and
interaction concurrency still need explicitly tested slices; do not infer those
fixes from this persistence extraction. Follow with owned/shared styling and the
separate modal/tab accessibility work.

## Phase 5p — HostExplore query/command lifetime and feedback fixes

Before extracting controllers, eight component regressions exposed defects in the
existing coordinator. All eight fail before the changes and pass afterward:
obsolete mount/StrictMode identity replies started new reads; an old community
response replaced a newer post-contribution refresh; a collection failure erased
failed-command feedback; late save/moderation auth replies issued writes after
unmount; and completed contribution/deletion commands started reloads off-page.

The coordinator now captures a mount lifetime and a per-collection request
generation. Only current reads may publish results or start their next query.
Commands check their captured lifetime after auth/persistence awaits, preventing
later writes/reloads and UI updates after departure. Already-issued requests can
still complete; nothing is cancelled or rolled back. Separate query/action error
channels give failed actions precedence; starting another action clears both as
before. This is an intentional behavior fix, kept separate from hook extraction,
styling, accessibility and interaction-concurrency changes. It does not introduce
an auth subscription or claim to handle every external identity change.

Verification with source/documentation frozen during browser jobs:

- All **366 unit/component tests**, lint/formatting, strict production build and
  Playwright type checks pass. All **18 desktop/mobile catalogue journeys** pass.
- **20 baseline/current comparisons** preserve exact subsequent SDK methods,
  URLs, Accept headers, bodies and command/reload order. Initial StrictMode
  collection GETs intentionally reduce from four to two: the obsolete effect no
  longer starts either read; the current queries retain their exact contracts.
  Independent initial arrival order is not constrained; raw traces retain counts.
- Those twenty ordinary states have exact raw DOM/attributes, geometry, standard
  computed properties and viewport PNGs at 1280/393px, without masks or class
  normalization. JSX and existing icon markup remain byte-identical, as do all
  **221 stylesheet files**, auth/client boundaries and persistence DTO behavior.
- The existing save-exception recovery regression also passes. No dependency,
  live backend write, schema migration or deployment occurred; Sentry uploads
  were disabled for builds. Whole-goal final verification remains outstanding.

Proceed with behavior-neutral favourites, community-read, contribution and
moderation controller extraction against this guarded baseline, then controlled
views. Keep pending action-concurrency and modal/tab accessibility work separate.

## Phase 5q — focused HostExplore controllers

The guarded coordinator now composes four focused feature hooks:
useExploreFavourites owns saved reads/mutations and their busy state;
useExploreCommunity owns community reads/reloads and recovered identity/admin
state; useExploreContribution owns the controlled draft, modal state and
create/edit commands; useExploreModeration owns review/delete confirmation,
commands and busy state. Each retains its own mount lifetime. The route owns
local filters, expansions, feedback precedence and navigation, supplying stable
feedback callbacks to the controllers. No persistence module is imported directly
by the route. The remaining large markup is explicitly queued for decomposition;
this checkpoint does not claim the page is fully migrated.

This is a behavior-neutral extraction from the separately committed lifetime
fixes. No new controller factory, context, state library, polling or visual design
was introduced. Connected hooks are not mounted by local styleguide previews.

Verification with source/documentation frozen during browser jobs:

- All **366 unit/component tests**, lint/formatting, strict production build and
  Playwright type checks pass. The prior eight lifetime/feedback regressions and
  save-exception retry regression remain unchanged and passing.
- All **18 desktop/mobile catalogue journeys** pass after extraction. **Twenty
  before/after comparisons** retain exact SDK methods, URLs, Accept headers and
  bodies; initial independent GETs are compared as a multiset, while subsequent
  commands/reloads retain strict ordering. Both versions keep only active mount
  reads after the preceding lifecycle fix.
- Those twenty states have exact raw DOM/attributes, geometry, every standard
  computed property and viewport PNGs at 1280/393px, with no masks or class
  normalization. All **221 stylesheet files** and used persistence/auth modules
  remain byte-identical.
- Mechanical checks match all six moved command/selection functions after only
  scoped feedback callback substitution, both read callback bodies, all eleven
  moved state initializers and each scoped lifetime effect. The query callbacks'
  sole new dependency is the route's stable query-error setter. Route JSX, its
  existing PlusIcon, projections, feedback precedence and navigation functions
  remain byte-identical.
- No live writes, migrations, deployment or dependencies. Verification builds
  disabled Sentry uploads; full-goal final tests and desloppify remain queued.

| Review slice       | Scrutiny                                                                        | Evidence                                                          |
| ------------------ | ------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Domain controllers | Focused state/read/write ownership, preserving lifetime guards and reloads      | Function/state/effect comparison; unchanged lifecycle regressions |
| Route wiring       | Stable feedback callbacks, original precedence and native interaction callbacks | All unit gates, eighteen browser cases and twenty SDK trace pairs |
| Presentation       | No markup/styling migration in this extraction                                  | Byte-identical JSX/styles and twenty exact DOM/style/PNG pairs    |

Next: controlled catalogue cards, forms and sections, a thin route/feature
coordinator and local backend-free examples. Then migrate owned/shared styling;
keep pending concurrency and modal/tab accessibility fixes in their own slices.

## Phase 5r — controlled catalogue views and thin route

HostExplore is now a thin adapter to CatalogueWorkspace. The feature coordinator
retains filters, navigation, feedback and all existing controller calls, then
projects domain records into explicit presentation values/callbacks. It selects
admin actions, private history and pending review records; resolves dates/detail
fallbacks; and binds exact task/venue/route actions. Presentation types live in
viewTypes.ts and do not depend on the page or connected controllers.

CatalogueView composes controlled CatalogueFilters, TaskCard, LocationCard,
RouteCard, CommunityReviewQueue/CommunityReviewItem and SubmissionHistory. Its
contribution slot composes ChallengeContributionDialog and
ChallengeContributionForm. Views do not read routes, auth, storage or persistence,
and never decide which records the user may see. Native tags, labels, validation
bounds, saved/busy state, disclosure/route expansion and action order are retained.
The form accepts typed draft patches and tag/submit/cancel callbacks; checked
native option values replace the old assertions. Nested presentation labels are
derived above JSX. The now-unconsumed TaskKind export is module-private.

The contribution frame deliberately retains its legacy focus/dismissal contract
for the separate native-dialog accessibility slice. Only submit disables while
busy; fields/cancel remain editable. Backdrop versus explicit close callbacks
retain their original state behavior. The feature-local PlusMark retains the
native decorative text glyph for parity, rather than introducing a new shared
icon pattern. Existing legacy classes remain pending owned/shared styling.

Local catalogue demonstrates the same controlled views with state only: saves,
selection notices, review actions, history, forms and pending/loading/error flags.
It never mounts CatalogueWorkspace or any connected controller. The catalogue
notes document every new component and its ownership. The reference imports the
existing legacy stylesheet to show the current catalogue appearance.

Verification with source/documentation frozen during browser jobs:

- All **366 unit/component tests**, lint/formatting, strict production build and
  Playwright type checks pass. Existing lifetime/feedback and save-retry tests
  remain passing. Sentry uploads were disabled.
- **36 affected browser cases pass** across desktop/mobile: the 34 existing
  catalogue/saved-item cases plus two new local-catalogue keyboard journeys.
  The new journey verifies save state, local add/moderation callbacks, native
  contribution submission, pending controls, editable fields, loading/error and
  zero backend requests. Its corrected pending-label assertion was rerun on both
  viewports; the production behavior did not change to satisfy the test.
- **24 production comparisons** at 1280/393px retain exact native outerHTML,
  element text/attributes, control values/checked/open state, focused element,
  geometry, every standard computed property and viewport PNGs, without masks
  or class normalization. Cases include optional prep/performance timings and
  venue reviews alongside read/write/error/create/edit/moderation states.
  Explicit legacy text runs preserve date-label measurements after JSX moves.
- SDK methods, URLs, Accept headers and bodies match in those twenty-four cases.
  Independent mount GETs are compared as a multiset; subsequent commands and
  reloads retain strict ordering and the guarded baseline's request counts.
- **24 retained-reference comparisons** cover four existing examples at six
  widths (393/760/761/850/851/1280px). Three examples retain exact markup,
  geometry and styles. HostShell markup/geometry and all other styles also match;
  the legacy import's sole outside selector sets dormant mobile-navigation grid
  tracks at widths up to 850px. It remains flex or hidden at every boundary, with
  no layout effect. The raw property difference is recorded, not normalized out;
  retire this obsolete declaration with the legacy stylesheet work.
- All original coordinator statements before the new adapters remain
  byte-identical, as do all existing Explore controllers/runtime models and
  **221 stylesheet files**. No dependency, live write, schema migration or
  deployment occurred. Source styles are unchanged; the reference's new import
  and dormant property difference above are explicitly accounted for.

This exceeds the approximate 800-line review budget. Most source delta is moved
markup; review the structural slices separately from adapter decisions:

| Review slice                  | Mechanical / scrutiny                                                                                                    | Evidence                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Route and coordinator         | Thin route; original state/controllers/navigation retained; scrutinize record selection and callback binding in adapters | Byte comparison of all original coordinator statements; SDK traces and existing journeys        |
| Controlled cards and sections | Native markup moved without added wrappers; dates/detail values now supplied                                             | Twenty-four exact production markup/control/style/PNG comparisons                               |
| Contribution composition      | Form/dialog slot, typed patches, option guards and original busy/dismissal contract                                      | Native form bounds, exact create/edit payloads, lifecycle tests and local keyboard form journey |
| Local reference/catalogue     | State-only examples, accurate ownership notes and legacy stylesheet import                                               | Zero backend traffic; existing-reference/selector audit at six widths                           |
| Retained exceptions           | Legacy styles, decorative PlusMark and modal/tab behavior await separate slices                                          | No palette/CSS-source changes; dormant grid declaration recorded explicitly                     |

Next: migrate catalogue styling into owned SCSS and shared primitives, then the
separately tested modal/tab accessibility and action-concurrency findings. Keep
private/public selection and callback contracts in the coordinator/controllers.

## Phase 5s — shared catalogue card frame

Task, location and route cards now compose `Card variant="idea"` rather than
repeating their native article/header frame. The required header slot preserves
the native div; ContentPanel's existing entity variant supplies the common
surface, border, radius and shadow. Card owns layout, title/body typography and
hover geometry in SCSS. Default/poster Card contracts remain unchanged. The
existing description color was promoted unchanged to a token. Badges, save
controls, metadata, tags and details remain for subsequent styling slices.

The backend-free Shared idea card example exercises a local action; the local
catalogue reference continues to use the same controlled production views.
Catalogue notes and agent guidance describe the shared frame and retained
exceptions. No controller, persistence, accessibility behavior or dependency
changed.

Verification:

- Lint/format, strict upload-disabled production build and Playwright type checks
  passed. All **366 unit tests** and **36 affected desktop/mobile browser cases**
  passed, including catalogue and saved-item local keyboard references.
- The CSS audit retired eight selector arms: five in HostPlanning and three in
  HostTheme. The remaining **317 legacy selector arms** retain exact conditions,
  order and declarations; the other three audited legacy stylesheets are
  byte-identical. All **1,391 prior expanded SCSS rule projections** retain their
  declarations and order.
- **34 desktop/mobile production comparisons** preserve native outerHTML,
  controls, focus, geometry, every standard computed property and SDK traces.
  Only the intentional root/header class renames and unused route-root class
  removal are normalized. Independent initial GET ordering is compared as a
  multiset; subsequent command/query order remains strict. Hover, saved hover,
  native keyboard focus and reduced-motion hover are included.
- **31 of 34 PNG pairs are pixel-exact.** The desktop approval scene and its
  repeat each differ by 13 edge pixels (maximum channel delta 27); desktop
  keyboard focus differs by 51 pixels (maximum channel delta 7). These small
  raster differences remain recorded without masks or a claimed explanation;
  DOM, geometry and computed styles match in those scenes too. The raw logs,
  PNGs, snapshots and pixel-delta reports live under `/tmp/phase5s-*`.
- Six additional desktop/mobile comparisons of the default Card, local saved
  items and planning reference preserve native markup, geometry and all computed
  properties, with no backend requests.

Next: shared catalogue badges and save controls, then metadata/details and the
remaining catalogue shell/editor styling. Modal/tab accessibility and duplicate
route-save concurrency remain separate behavior slices. The full-refactor queue
below remains active; final whole-suite verification and desloppify are pending.

## Phase 5t — shared catalogue category badges

Task, location and route headers now compose Badge's idea variants with the same
native span, caller-supplied label and category tone. The shared badge block owns
pill geometry, typography and tones; six legacy category selectors were retired.
Four existing palette values were promoted unchanged to tokens, and the other
colors/scales reuse existing tokens. Card views still own their category labels;
Badge does not choose domain values or access a backend.

The Shared idea card reference demonstrates the base and all five category
variants with local data. Its keyboard journey also checks the visible category
labels; catalogue notes and agent guidance reflect their shared ownership.
Existing save controls, metadata, tags and details remain the next migration
slice. No persistence, native interaction behavior or dependency changed.

Verification:

- Lint/format, strict upload-disabled production build and Playwright type checks
  passed; all **366 unit tests** and **36 affected desktop/mobile catalogue and
  saved-item browser cases** passed.
- **Thirty production baseline comparisons** preserve native outerHTML, control
  state, focus, geometry, all standard computed styles and SDK traces, normalizing
  only category class renames. Independent initial reads are a multiset; later
  operations preserve strict sequence. Scenes include location cards, collapsed
  and expanded route outlines, saves, errors, contribution editing/creation and
  moderation. **29 PNG pairs are pixel-exact**; desktop approval retains the
  recorded 13 edge-pixel difference (maximum channel delta 27), without masks.
- Six additional desktop/mobile comparisons preserve existing poster badges,
  local saved items and planning reference markup/geometry/all computed styles,
  with zero backend traffic. The reference runner's historical log label still
  says default Card; the actual selected example is Poster surfaces, badges and
  typography, alongside saved items and planning panels.
- All **1,396 previous expanded SCSS projections** retain exact declarations and
  order. After six category selector removals, **311 legacy selector arms** retain
  exact declarations, conditions and order. HostTheme and the other three audited
  legacy stylesheets are unchanged. Evidence lives under `/tmp/phase5t-*`.

Next: share save/close controls and migrate remaining card metadata, tags,
disclosures and route-outline presentation into owned SCSS, preserving native
forms/actions and current pending behavior. Follow with the catalogue shell and
editor styles, then separate modal/tab accessibility and concurrency fixes. The
remaining full-refactor queue and final desloppify gate remain active.

## Phase 5u — shared catalogue controls and card details

The three controlled catalogue cards now compose shared IconButton save/saved
controls, MetadataList/MetadataItem, TagList/Badge tag, and explicit Button action
variants. Location practical checks reuse native Disclosure idea. Route expansion
composes a controlled outline-toggle Button and presentation-only StepOutline;
the feature still supplies step order, detail copy, note and callbacks. The
contribution dialog close action reuses IconButton idea-close. Native elements,
labels, titles, form types, bounds and existing pending behavior are retained.

Owned SCSS replaces the corresponding legacy card-content rules. Seven existing
colors and the existing circular radius were promoted unchanged to tokens. Task
add actions retain 11px text; venue/route footer actions and outline toggles retain
their effective inherited host typography. The previous host-wide font reset
makes several old single-class font declarations ineffective; the comparison
caught that distinction before completion. Existing Button variants retain exact
class output, and planning's default tag-list styles remain unchanged.

The backend-free Shared idea card reference demonstrates the new primitives,
save/unsave, pending, native disclosure, controlled outline and close callbacks.
Its new keyboard journey exercises those paths using Enter and native checkbox
Space activation. Catalogue notes and agent guidance describe their ownership.
No dependency, controller, persistence contract or accessibility behavior changed.
The decorative PlusMark and card admin-action arrangement remain for later work.

Verification:

- Lint/format, upload-disabled strict production build and Playwright type checks
  passed; **366 unit tests** and **38 affected mocked desktop/mobile browser
  cases** passed. Ordinary tests use no live backend.
- **Fifty production comparisons** preserve native tags, text, attribute/value
  maps, controls, focus, geometry and all standard computed properties. Serialized
  DOM canonicalizes attribute order and applies explicit class-renaming maps;
  previously unclassed metadata/outline/tag elements gain owned block classes.
  No wrappers or text are ignored. SDK traces preserve initial independent GET
  multisets and strict subsequent command/query ordering.
- Coverage includes task/venue/route cards, native open practical checks,
  expanded outlines, save errors/pending states, contribution create/edit errors,
  moderation, hover, keyboard focus and reduced motion. **48 of 50 PNG pairs are
  pixel-exact**. Desktop approval differs by the recorded 13 edge pixels (maximum
  channel delta 27); desktop save focus differs by 15 pixels (maximum channel
  delta 46). These differences remain recorded without masks or an asserted
  explanation; DOM, geometry and computed properties match in both scenes.
- Six additional desktop/mobile comparisons preserve existing poster badges,
  saved items and planning reference markup, geometry and computed properties,
  with zero backend requests. All **244 previous Button variant/fullWidth/class
  combinations** produce exact class output. All **nine Explore controller,
  model, catalogue and persistence modules** audited are byte-identical.
- **Twenty-seven legacy selector arms** retired: 26 from HostPlanning and one
  from HostTheme. The remaining **284 arms** retain exact declarations,
  conditions and order; the other three audited legacy stylesheets are
  byte-identical. All **1,402 prior expanded SCSS projections** retain declaration
  order/values. The final circle-token promotion additionally preserves the whole
  expanded stylesheet byte-for-byte. Evidence lives under `/tmp/phase5u-*`.

The focused close-hover comparison uses an additional 1800px-tall viewport: at
1280×900, the existing sticky header covers the center of the contribution close control
after scrolling it into view. Direct hit testing confirms the same rectangle and
header interception in baseline/current code. The checked 393×900 control remains
unblocked. Keyboard-focus comparisons retain the standard 900px height. This
known desktop defect belongs in the forthcoming native-dialog accessibility
slice, alongside focus containment/restoration; taller-view hover coverage does
not prove the standard-height pointer path works.

This exceeds the approximate 800-line review budget. Review the following slices
separately; the final commit preserves their atomic composition:

| Review slice                     | Mechanical changes / scrutiny                                                                                                                           | Evidence                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Shared primitives                | Native metadata, tags, disclosure and ordered outline; scrutinize slot/data boundaries and explicit Button variant wiring                               | Local keyboard regression; 244 unchanged prior Button outputs; existing-reference comparisons                                  |
| Controlled card/dialog callers   | Replace repeated native presentation with shared views; scrutinize retained labels, pending/footer behavior, callbacks and caller-supplied outline copy | Fifty native DOM/control/style/SDK comparisons; 38 affected journeys; controllers/services unchanged                           |
| Owned SCSS and legacy retirement | Promote existing values and combine effective host styles; scrutinize specificity and inherited typography                                              | 27 retired arms, 284 retained arms and 1,402 retained SCSS projections; desktop/mobile computed styles and recorded PNG deltas |
| Local reference and notes        | State-only demonstrations, keyboard pending/disclosure/outline paths and accurate component ownership                                                   | Zero-backend local journeys; lint/build/type gates; standard-height obstruction explicitly recorded                            |

Next: catalogue shell, filters, moderation/history and editor styling. Follow with
the separate native-dialog/tab accessibility and duplicate-action concurrency
slices, including the verified desktop close obstruction. Continue the remaining
V2/legacy queue below; full-suite verification and final desloppify remain pending.

## Phase 5v — shared catalogue shell and filters

CatalogueView now composes shared FeatureBanner/Overline banner and decorative
StickerArt, PageHeading results with ControlRow heading-actions, PanelGrid ideas,
ContentPanel workspace-error, EmptyState workspace icon/title/action slots and
Note collection-loading. CatalogueFilters composes TabList, Button collection-tab,
CountBadge tab, SearchField and FilterGroup/Button category. The controlled
coordinator, state, domain selection, callbacks and navigation remain unchanged.
The unused results-container marker was removed without adding a wrapper.

Owned SCSS supplies their original appearance and responsive behavior. Existing
paint, color, type, spacing and tilt values are preserved through tokens. Palette
primitives reused inside the promoted banner paint tokens additionally preserve
the entire expanded stylesheet byte-for-byte. The backend-free Local catalogue
reference exercises these same primitives and its existing keyboard journeys;
catalogue notes and agent guidance describe their ownership. No dependency,
persistence or accessibility interaction change is included.

Three existing compact main-page-header Button selectors now exclude only the
new results-heading modifier through zero-specificity `:where(:not(...))`. Their
declarations, media conditions and specificity remain unchanged. This prevents
main-header icon-only action sizing from affecting the catalogue's ordinary
create action. Existing default heading behavior is checked separately.

Oxlint now maps the shared Button wrapper to its actual native button element.
No accessibility rule was disabled or downgraded. The valid shared tab probe
passes without diagnostics; negative probes retain errors for an unfocusable
tab, its missing keyboard handling and an invalid noninteractive Button role.

Verification:

- Lint/format, upload-disabled strict production build and Playwright type checks
  passed. All **366 unit tests** and **38 affected mocked desktop/mobile browser
  cases** passed, including native keyboard search/clear, category/tab selection,
  loading/error/empty recovery and local catalogue/saved-item journeys.
- **58 production baseline comparisons** preserve native tags, text,
  attribute/value maps, controls, focus, geometry, all standard computed
  properties and SDK traces. Banner `::before`/`::after` properties are compared
  too. Serialized DOM canonicalizes attribute order and explicit class renames,
  including newly assigned primitive classes and the unused marker removal; no
  wrappers or text are ignored. Initial independent reads use a multiset;
  subsequent commands/queries retain strict ordering.
- The 46 desktop/mobile state pairs include native open practical checks,
  expanded outlines, saves, errors, contributions, moderation, loading, empty
  search, category selection and keyboard/pointer focus states. Another **12
  pairs** check both sides of 560px, 650px, 760px, 850px, 900px and 1140px boundaries.
  All 12 breakpoint PNG pairs are pixel-exact.
- **53 of 58 PNG pairs are pixel-exact**. The five small differences below remain
  recorded without masks or an asserted explanation. Their native DOM, geometry,
  banner pseudo-elements and computed properties match. Final aggregation
  supersedes the earlier in-progress screenshot count.

| Width | Scene              | Changed pixels | Maximum channel delta |
| ----- | ------------------ | -------------- | --------------------- |
| 393   | Native tab focus   | 49             | 19                    |
| 1280  | Native tab focus   | 12             | 6                     |
| 1280  | Search clear focus | 4              | 1                     |
| 1280  | Search input focus | 4              | 6                     |
| 1280  | Approval           | 13             | 27                    |

- **Ten existing-reference comparisons** preserve poster, saved-item, planning,
  main-heading/host-shell and plain-child saved-loading markup, geometry and all
  computed properties at desktop/mobile sizes, with zero backend requests. All
  **276 prior Button variant/fullWidth/class combinations** produce exact class
  output. Thirteen coordinator, controller, model/catalogue, type and persistence
  modules are byte-identical to the committed baseline.
- **54 legacy selector arms** retired: 44 from HostPlanning and ten from
  HostTheme. The remaining **230 arms** retain exact declarations, conditions
  and order; HostPortal, PlayerGame and Globals are byte-identical. Of **1,433
  prior expanded SCSS projections**, 1,430 retain exact selectors as well as
  declarations/order; the three explicitly scoped default-heading selector arms
  retain their declarations/order/conditions after the named exclusion mapping.
  Evidence lives under `/tmp/phase5v-*`. Older completed-phase JSON snapshots are
  losslessly gzip-compressed with decompressed SHA-256 verification; their PNGs,
  scripts and logs remain available.

This exceeds the approximate 800-line review budget. Review the slices separately:

| Review slice                      | Mechanical changes / scrutiny                                                                                                                                | Evidence                                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Shared presentation contracts     | New banner/art/search/tab frames and extensions of heading, grid, count, filter, loading/error/empty primitives; scrutinize native types, slots and defaults | 58 native DOM/style/SDK comparisons, ten default-reference pairs and 276 unchanged Button outputs                  |
| Controlled catalogue wiring       | Replace repeated shell/filter markup; retain labels, counts, callbacks and unused-marker removal                                                             | 38 affected browser journeys; thirteen coordinator/model/type/persistence modules unchanged                        |
| Owned SCSS and retirement         | Promote existing values; preserve gradients, pseudo-elements, breakpoints and effective typography; scrutinize the three new-heading exclusions              | 54 retired/230 retained legacy arms; 1,433 SCSS projections; twelve boundary pairs and recorded raster differences |
| Lint awareness and local contract | Native Button mapping, accurate catalogue guidance and existing local previews                                                                               | Valid/negative lint probes, zero-backend keyboard journeys and lint/build/unit/type gates                          |

Next: moderation/history and contribution-editor styling, including the retained
card admin-action arrangement. Then handle native-dialog/tab accessibility and
concurrency in separate behavior slices, including the verified desktop close
obstruction. Continue the remaining V2/legacy queue below; full-suite verification
and the requested final desloppify audit remain pending.

## Phase 5w — shared moderation, history and contribution editor

Catalogue moderation/history now compose ContentPanel moderation/history/item,
PanelHeading moderation, Overline/CountBadge moderation, Badge moderation-type,
PanelGrid stack, ControlRow/Button moderation and HistoryRow/StatusPill history.
The feature retains visibility, record selection, date/detail copy, ordering and
callbacks. HistoryRow accepts presentation slots and never chooses publication
state or formats dates. The unused admin-action marker was removed.

Contribution bodies compose DialogPanel/PanelHeading contribution,
FormStack/FormLabel/FormGrid contribution, TagPicker/Button tag-option, Explainer
contribution and DialogActions/Button editor variants. Native elements, heading
IDs, labels, required/length/numeric bounds, submit/button types and existing
editable-while-pending fields are retained. TagPicker only groups supplied
controls; selection, maximum-eight disabling/order and callbacks remain in the
feature. Existing values were promoted to tokens, with effective inherited tag
font/disabled styling preserved rather than reviving overridden legacy values.

Owned SCSS replaces the review/history/editor rules. The outer contribution
backdrop and decorative PlusMark remain explicit legacy exceptions until their
separate behavior/icon slices. Moving visual frames does not add modal focus,
Escape/backdrop handling or fix the recorded desktop close obstruction. No
controller, persistence, dependency or accessibility interaction changed here.

The backend-free Local catalogue continues to demonstrate the actual controlled
form and review views. New Shared review and history exercises local decisions,
all three history statuses, optional notes and pending controls. Its new native
keyboard journey covers approve/reject and checkbox Space activation, with zero
backend requests. Catalogue notes and agent guidance describe these boundaries.

Verification:

- Lint/format, upload-disabled strict production build and Playwright type checks
  passed. **366 unit tests** and **40 affected mocked desktop/mobile browser
  cases** passed, including native form bounds, tag limits, trimmed command
  payloads, moderation/reloads and the new local review/history keyboard journey.
- **Forty production/breakpoint comparisons are pixel-exact**, and preserve
  native tags/text/attribute-value maps, controls, focus, geometry, all standard
  computed properties and SDK traces. Serialized DOM canonicalizes attribute
  order and explicit class renames; no wrappers or text are ignored. Initial
  independent GETs are a multiset; later operations retain strict ordering.
- Twenty-six desktop/mobile state pairs cover create/edit frames, tag limits,
  native title focus, review/history, approval/rejection, venue review, create/
  edit completion and failure, and pending writes. Pending snapshots compare the
  same in-flight boundary; completion/reload contracts are exercised separately
  by ordinary scenarios and regressions. Fourteen additional pairs cover create
  and review views at 560/561, 649/650/651 and 900/901px.
- **Ten existing-reference pairs** preserve poster, saved-item, planning,
  main-heading/host-shell and plain-child saved-loading markup, geometry and all
  computed properties at desktop/mobile sizes, with zero backend traffic. All
  **288 prior Button variant/fullWidth/class combinations** retain exact class
  output. Thirteen coordinator/controller/model/catalogue/type/persistence
  modules are byte-identical to the committed baseline.
- **59 legacy selector arms** retired from HostPlanning. The remaining **171
  audited arms** retain exact declarations, conditions and order; HostTheme,
  HostPortal, PlayerGame and Globals are unchanged. All **1,478 prior expanded
  SCSS projections** retain exact selectors, declarations and order. Evidence
  lives under `/tmp/phase5w-*`; the production-state proof combines the completed
  mobile comparisons and remaining desktop/pending run without changing app
  source between them.

This exceeds the approximate 800-line review budget. Review the slices separately:

| Review slice                           | Mechanical changes / scrutiny                                                                                                                                         | Evidence                                                                                                                 |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Shared review/history                  | Frames, headings/counts, ordered rows, caller-composed status and comic actions; scrutinize slot boundaries and approved history's original plain treatment           | Forty exact native/style/PNG/SDK pairs; local approve/reject/pending journey; controllers and models unchanged           |
| Contribution form/frame                | Shared native frame/form/labels/grid, controlled tag slots, notice and explicit submit/cancel variants; scrutinize IDs, bounds, tag selection/order and busy contract | Native form/command regressions, tag-limit/focus/pending comparisons and fourteen responsive pairs                       |
| SCSS and legacy retirement             | Promote existing values and preserve effective inheritance without expanding route CSS                                                                                | 59 retired/171 retained arms, 1,478 unchanged SCSS projections, default-reference pairs and 288 unchanged Button outputs |
| Local contract and retained exceptions | State-only reference/catalogue notes; outer backdrop and decorative mark remain explicit                                                                              | Zero-backend keyboard journeys; lint/build/unit/type gates; modal behavior deliberately queued separately                |

Next: separately tested native contribution-dialog lifecycle/feedback and tab
keyboard semantics, then synchronous action/concurrency guards. Include the
recorded desktop close obstruction and stale dialog completion risks. Continue
remaining V2/legacy work below; full-suite verification and final desloppify remain
pending.

## Phase 5x — native contribution dialog and submission lifetime

The contribution editor now composes the shared native Dialog. Its visible heading
and description label the modal; background controls are inert, Tab/Shift+Tab stay
inside, Escape/backdrop/Close/Cancel share one callback, and closing restores the
opener. This intentionally fixes the desktop Create close obstruction: the native
top layer covers the host header. Existing overlay values were promoted unchanged;
the final legacy contribution backdrop rule was retired. PlusMark remains queued
for semantic-icon migration.

SessionFeedback renders inside the modal, where failure copy and dismissal remain
reachable. Ordinary page feedback is hidden while it is open. The feature retains
query/action separation, command payloads, validation, tag limits and the existing
editable-fields/enabled-cancellation pending contract.

The contribution controller now synchronously locks submission and tracks each
dialog generation. Closing before identity resolves prevents an unissued write;
a completed old write cannot reset/close a fresh dialog, publish stale feedback,
unlock its pending action or reload its data. Issued writes can still finish on the
server; there is no rollback claim. Editing dismissal clears its identity/draft;
unsent create drafts survive cancellation. Thrown identity failures release the
current lock and allow retry.

The shared native focus hook now recovers after a focused control is disabled or
removed, without disturbing focus already inside. A targeted visibility regression
caught that preventScroll left recovered Close focus above the scrolled viewport;
recovery now scrolls that enabled control into view. This intentional accessibility
change is separate from the preceding presentation extraction.

Verification:

- Five new lifetime regression cases failed against the committed implementation
  before the controller change; both initial modal journeys failed on desktop and
  mobile before native modality. The added pending-focus visibility assertion
  failed on both sizes before its correction. Evidence: `/tmp/phase5x-before-*`
  and `/tmp/phase5x-visibility-before-*`.
- Lint/format, upload-disabled strict production build, Playwright type checks
  and git whitespace checks pass.
- **372 unit tests** pass, including six new contribution lifecycle/retry cases.
  **120 affected mocked desktop/mobile browser cases** pass across catalogue,
  saved items, host editors, private missions, rewards and guided tours. New modal
  journeys exercise native modality, full keyboard paths, initial/wrapped/recovered
  focus, viewport visibility, close hit testing, opener restoration, errors,
  backdrop edit cleanup and obsolete pending-write completion.
- Eight before/after create/edit comparisons at 393/1280px and 900/1800px heights
  preserve inner tags/text/control values, geometry, focus and attributes, apart
  from moving role/heading linkage to the native dialog and its new description
  ID. Standard computed properties match except Chromium's native-dialog inherited
  user-select text; Tailwind custom-property defaults also differ at the native
  modal boundary. Full screenshots intentionally differ in layering/scrim. Four
  supplementary unobscured frame crops differ by 140–996 pixels (maximum channel
  deltas 2–30); no pixel-exact or whole-page behavior-neutral claim is made.
  Desktop Create close center changes from obstructed to reachable. Raw snapshots,
  screenshots and comparisons live under `/tmp/phase5x-frame-*`.
- The backend-free local catalogue uses the same native modal and feedback slot.
  Shared reference notes are updated. HostExplore's 32 browser cases are now
  included in the default Playwright configuration, rather than only scoped runs.

Next: catalogue tab keyboard semantics and explicit results linkage; then
synchronous favourite/moderation action guards. Continue the remaining V2/legacy
migration and final full-suite/desloppify work below.

## Phase 5y — catalogue keyboard tabs and linked panels

The shared TabList now supports horizontal Left/Right wrapping and Home/End,
focusing and activating supplied native tab buttons. The feature retains selected
state and category/search rules; roving tabIndex leaves only the selected tab in
the Tab order. useId supplies unique tab/panel relationships. Shared TabPanel owns
native role/label/hidden state and a token-based keyboard focus ring. Inactive
panels remain identifiable without mounting their content; only the active panel
is keyboard-reachable. No controller, persistence or styling conversion is mixed
into this accessibility slice.

The backend-free local catalogue demonstrates the same primitives. Catalog notes
and existing keyboard regressions now use arrow selection rather than trying to
Tab to an inactive tab. New production/local-reference desktop/mobile journeys
cover Tab entry/exit, wrapping, Home/End, ignored vertical arrows, selected-state
updates, all three linked panels, visible panel focus and native mouse selection.

Verification:

- Four new browser cases failed against the committed pre-change tab behavior.
  All **52 affected mocked desktop/mobile catalogue and saved-item cases** now
  pass, including those four real keyboard journeys and the previous modal cases.
- **372 unit tests**, lint/format, upload-disabled strict build, Playwright type
  checks and git whitespace checks pass.
- Six before/after production state pairs cover all three tabs at 393/1280px.
  Every pair is **pixel-exact** and preserves native tags/text/control values,
  focus, geometry and all standard computed properties. DOM comparisons normalize
  only the explicit tab/list/panel accessibility attributes and class, and omit
  the two new empty hidden panels. No text, controls or active content is ignored.
  Evidence: `/tmp/phase5y-before-*`, `/tmp/phase5y-affected-*` and
  `/tmp/phase5y-tabs-*`.

Next: synchronous per-item favourite/moderation guards while preserving independent
item concurrency, followed by remaining host/admin and V2 slideshow layers. Final
full-suite verification and desloppify remain pending.

## Phase 5z — reward confirmation matches edited award points

Manual reward confirmation now shows the same normalized edited points value sent
to the existing completion command. Previously editing 20 configured points to
37 submitted 37 while confirming 20. The calculation remains bounded to 0–10000,
with the existing non-numeric fallback. Voting continues to confirm configured
points and submits null for the manual override. Winner order, separate player/
team payloads, cancellation, locking and reload behavior are unchanged.

Four new regression cases failed before the correction. Eight focused reward-hook
tests now pass, covering edited values, lower/upper bounds, non-numeric fallback,
voting and cancellation. All **16 mocked desktop/mobile reward-control browser
cases** pass; manual player/team awards for both methods verify the actual native
confirmation text on cancellation and acceptance against the existing 37-point
command payload. Evidence: `/tmp/reward-confirm-*`. This is an intentional copy
correction, separate from structural and styling migration.

Next: integrate the independently verified catalogue concurrency and slideshow/
admin layers, then continue remaining V2/legacy and final full-suite/desloppify work.

## Phase 6a — catalogue per-item command locks

Catalogue favourites now lock synchronously per type/id, and moderation review and
delete share a lock per submission. Independent items remain usable concurrently;
completion releases only its own indicator, including while a moderation refresh
is pending. A current favourite snapshot keeps retained callbacks from issuing a
second save after the first completed. Guarded catch/finally allows retries after
identity/transport exceptions without stale feedback or unlocks after unmount.
Persistence modules, payloads, review status filters and server contracts are
unchanged. This does not prove deployed uniqueness or backend idempotence.

Nine deferred regressions failed before the change. Thirteen new operation tests
and fourteen existing lifecycle cases pass; all **56 mocked desktop/mobile
catalogue/saved-item browser cases** pass. The new keyboard journeys prove
independent overlapping native save-button states and one POST despite repeated
activation of an enabled route footer while its first save is pending. No styling
or presentation extraction is mixed into this behavior slice. Evidence:
`/tmp/catalogue-concurrency-*`.

Separate read audit reproduced rejected initial identity leaving loading active,
a completed save being overwritten by an older initial GET, and stale community
identity/admin presentation after auth recovery fails. Those remain queued for
focused read-lifecycle regressions and reconciliation; they are not covered by
this command-lock completion claim.

## Phase 6b — platform admin layers and regression baseline

SuperAdmin is now a thin adapter to PlatformGames. Separate list and inspector
hooks retain the original SDK/error sequencing; controlled PlatformGamesView,
GameTable and GameInspector receive records/state/callbacks. Typed query adapters
retain the existing list/detail RPC names and arguments. Consumed frontend shapes
live in types/superAdmin.ts; they are inferred contracts, not verified deployed
schema or authorization types. Original sa-* styling, native controls, fallback
copy, incoming order and complete-list totals are retained.

Six new pre-extraction route tests and **eight mocked desktop/mobile browser
journeys** pass. All **16 before/after list/filter/empty/access/detail/loading/error
comparisons are exact**, including full native DOM/attributes/text/control values,
focus, geometry, every standard computed property, SDK traces and screenshots.
There are no DOM normalizations or pixel tolerances. Evidence:
`/tmp/admin-baseline-unit.log`, `/tmp/admin-{before,after}-browser.log` and
`/tmp/admin-parity-*`.

This extraction exceeds the approximate 800-line review budget. Review map:

| Slice                  | Mechanical changes / scrutiny                                                                                            | Evidence                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| Regression baseline    | New route and native keyboard journeys; scrutinize list/detail RPCs, filtering, totals and fallback expectations         | Six units, eight browser cases before and after        |
| Route and presentation | Move original markup into controlled views; no styling or behavior fixes                                                 | Sixteen exact DOM/style/geometry/SDK/PNG pairs         |
| Hooks and typed reads  | Separate list/inspector concerns without silently fixing old races; scrutinize inferred types and SDK rejection contract | Strict build, full unit suite and unchanged RPC traces |

Known defects remain explicitly queued: obsolete list/detail outcomes; closing an
inspector during loading; rejected transports; feedback outside an already-open
inert modal; toolbar labels and the empty action header. The next behavior slice
must add regressions before fixing these. Legacy admin styling/shared-primitives
migration follows separately.

## Phase 6c — shared final/secret TV presentation

Both V2 TV routes now compose SlideshowScreen, SlideshowMessage,
SlideshowEvidence and SlideshowCaption. They accept resolved URLs, presentation
values and callbacks; no shared component reads backend, storage or route state.
The common frame retains optional counter/fullscreen/feedback composition, native
image/video attributes, caption order and current cc-final-tv styling. Queries,
selection, timing, media/fullscreen feedback and cleanup remain in the route for
this neutral extraction; **6,417 controller bytes are identical** to baseline.

The Shared TV slideshow local reference exercises evidence selection, waiting/
empty states, feedback and a simulated fullscreen action without backend access
or requesting a fullscreen device. It uses div semantics inside the styleguide.
All four component contracts are documented in the catalog.

Twelve pre-extraction route regressions pass, covering public RPC payloads,
evidence bucket, waiting/empty states, polling/selection, out-of-order reads,
image cadence/video completion, error handling and unmount. All **ten mocked
desktop/mobile browser cases** pass, including active native media, exact initial
payloads and one additional polling cadence, fullscreen failure, missing mission
and local keyboard behavior. Tests preserve StrictMode's duplicate initial effects
and explicitly control time after route bootstrap, rather than changing the app
to match a mistaken single-read expectation.

All **34 before/after desktop/mobile state pairs** preserve exact native HTML,
standard computed properties, geometry, focus and public RPC traces. Loader
animations are paused at time zero on both sides; the original nondeterministic
attempt remains recorded separately. The served baseline uses SHA-verified
unmodified route sources. **33/34 screenshots are pixel-exact**. In the remaining
1280px final-video pair, native playback advanced after DOM sampling and before
one screenshot, producing an image/counter transition. That PNG does not prove
video-frame parity; exact video markup/style comparisons and the explicit native
ended/cadence regressions are separate evidence. No tolerance hides the difference.
Evidence: `/tmp/slideshow-layer-proof-deterministic`,
`/tmp/slideshow-layer-controller-proof.json` and
`/tmp/slideshow-layer-persistent-final-browser.log`.

The combined parallel tranche exceeds the approximate 800-line review budget.
Review reward confirmation and catalogue concurrency as intentional behavior
slices; review admin and TV presentation as mechanical extractions with focused
controller/type scrutiny. The admin map is above; TV review map:

| Slice                      | Mechanical changes / scrutiny                                                                                     | Evidence                                                                                                       |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Shared frame/media/caption | Preserve native markup/order/media identity and supplied callbacks; scrutinize video key and optional frame slots | Thirty-four exact DOM/style/geometry/RPC pairs; 33 exact PNG pairs with one recorded temporal-video limitation |
| Route composition          | Replace duplicate presentation, retain query/timer behavior                                                       | 6,417 byte-identical controller bytes, twelve route regressions, ten browser cases                             |
| Local contract             | Local-state example and accurate catalog/default-test registration                                                | Keyboard/error/fullscreen-simulation journey with zero backend traffic                                         |

Across phases 5z/6a/6b/6c, **409 unit tests and 90 affected desktop/mobile cases**
pass; lint/format, upload-disabled strict build, Playwright type checks and git
whitespace checks pass. The default browser configuration now registers **422
cases in 21 files**, including new catalogue-concurrency, admin and slideshow
specs. Registration is not a claim that the complete current suite was run; the
final full mocked suite remains required.

Next: separate catalogue read reconciliation/recovery, admin list/inspector
lifetime/feedback and slideshow session-ID/controller layers. The shared host auth
boundary also needs user-ID remount and stale initial recovery regressions. Legacy
styling, remaining V2/legacy layers and final desloppify remain outstanding.

## Phase 6d — catalogue read recovery and snapshot reconciliation

Initial favourite identity/read exceptions now settle current loading and report
feedback; obsolete outcomes stay silent. Community identity failure clears user/
admin presentation and prunes cached non-approved rows, retaining approved public
rows until recovery. The existing query/action feedback separation remains.

A favourite read tracks successful local mutation keys since its request began.
Its accepted snapshot combines untouched incoming records with current records
for changed keys; removal remains a tombstone. An old initial GET can no longer
undo a completed save/remove, and failed mutations do not override server rows.
This preserves unrelated incoming order and existing commands without extra reads
or disabling unrelated controls. It does not prove server uniqueness when an
unknown existing favourite is saved before its initial read finishes.

Six of nine new tests failed before fixes, with two escaped rejections. All
**36 focused read/operation/page-lifecycle tests** and **58 mocked desktop/mobile
catalogue/saved-item browser cases** pass. The new visible regression gates an old
initial snapshot containing another saved task, completes a save, then verifies
both saved labels and settled loading. The immutable snapshot's 827-file manifest
and four owned live files were SHA-verified after testing. Evidence:
`/tmp/catalogue-read-before.log`, `/tmp/catalogue-read-after.log`,
`/tmp/catalogue-read-verified-*`.

## Phase 6e — authenticated host identity boundary

HostGuard keys its private outlet by authenticated user ID. A different host gets
fresh feature state and lifecycles; a replacement token for the same host preserves
local state. An auth notification also invalidates the older initial getSession
recovery, preventing it from erasing newer sign-in state. Existing subscription
cleanup, routes and separate player credential keys are preserved.

Two corrected regression cases fail before the change; all **six unit cases** now
pass, including same-host token retention, different-host remount, obsolete empty/
non-empty recovery and unmount cleanup. The native SDK mocked desktop/mobile
journey switches A→B, checks the reset/search and B's favourite read, replaces B's
credentials without remount/read, then signs out to login with no writes.
**Both browser cases pass** from the immutable snapshot. A later test-only type
annotation correction has byte-identical emitted JavaScript; runtime evidence is
retained rather than rerunning an unchanged journey. Evidence:
`/tmp/host-identity-{before,after}-unit.log`, `/tmp/host-identity-styled-*` and
`/tmp/host-identity-runtime-proof.json`.

## Phase 6f — platform list and inspector lifecycle

The list hook now guards mount and refresh generations, preserving current rows/
loading/access feedback when older reads resolve. Inspector open/current-id state
is explicit; close invalidates synchronously, including pending reads. Old replies
cannot reopen, overwrite or unlock a fresh inspection. Retry retains its current
id; null details become a recoverable error. Named queries adopt existing runApi
transport recovery without changing either RPC or its arguments.

List/detail feedback is separate. Inspector errors and retry render inside the
native modal; its inert page duplicate is hidden. Starting inspection/retry and
explicit dismissal clear both channels, while an ordinary list refresh cannot
erase a detail failure. Escape, Close and backdrop remain available during reads
and restore the opener. Shared HostGuard remount supplies account-identity
invalidation; no duplicate auth subscription was added.

Fourteen new regressions failed before fixes; all **21 scoped units** and **18
mocked desktop/mobile browser cases** pass. Original modal negatives and corrected
stale-refresh negatives are preserved. The first stale-refresh fixture gated only
one StrictMode initial request and is not used as proof; its corrected baseline
holds all initial reads and fails on obsolete denial, while legitimate persistent
denial/explicit Refresh succeeds. All twelve owned live files match the tested
839-file snapshot. Evidence: `/tmp/admin-lifecycle-before-unit.log`,
`/tmp/admin-lifecycle-before-v2-browser.log`,
`/tmp/admin-lifecycle-after-v2-browser.log` and
`/tmp/admin-lifecycle-live-proof-v2.json`.

Review the request/dialog state and feedback ownership separately from typed query
recovery and regressions. No labels or SCSS migration is included; toolbar labels,
empty action header and shared-primitives/owned-style conversion remain queued.

### Immutable verification checkpoints

Browser jobs now serve curated immutable copies of source, tests, styles, public
assets and required config, with a unique Vite cache and dummy backend settings.
No environment files or git metadata are copied. A SHA manifest verifies source
stability during copying, exact served content and owned live-file correspondence
after testing. Only the deliberate cacheDir config change is recorded separately.
Served snapshot source remains frozen while agents work on the live checkout;
failures require corrected live code and a new snapshot, not changes to evidence.

The integrated checkpoint passes **463 unit tests**, an upload-disabled strict
build and Playwright type checks. Live lint/format also passes; the first snapshot
lint invocation lacked the Stylelint config and is not reported as a passing gate.
The snapshot helper now includes the actual mjs config for future captures. The
complete final browser suite and desloppify remain outstanding.

## Phase 6g — TV session identity and focused external concerns

Both TV routes are thin session-ID adapters to keyed FinalSlideshow and
SecretSlideshow coordinators. Changing session immediately removes the previous
session's evidence, selection and feedback, including when the next read is pending
or fails. Returning A→B→A resets local playback even with unchanged/null host IDs.
Obsolete read and fullscreen outcomes cannot mutate another mounted session.

Typed inferred view contracts and named runApi read services live outside pages.
Ordinary focused hooks own polling, atomic view/host-selection projection, media
cadence/error reset and fullscreen lifecycle separately. The original public RPC
names/session-only arguments, existing bucket URL resolver, 1500ms polling,
latest-applied-response ordering, host selection/clamping and 6s/15s image cadence
are retained. Shared presentation remains pure; no styling conversion is included.

Eight identity regressions failed before fixes. All **36 focused route/query
units** and **22 mocked desktop/mobile browser cases** pass, including pending/
failed B privacy, A→B→A, obsolete responses/fullscreen, active media and local
reference behavior. The integrated immutable checkpoint passed **463 unit tests**,
upload-disabled strict build and browser type checks; live lint/format passed.

All **34 same-session DOM/style/geometry/focus/RPC comparisons and PNG pairs are
exact**. The four video states synchronously pause native play in the identical
baseline/current capture harness before decoded-frame sampling; DOM stays stable
across its PNG. Actual autoplay/ended/cadence is tested separately, not suppressed
in the app. The previous phase6c temporal-video limitation remains recorded in
its original evidence; this new controlled set has zero pixel delta. Two unused
internal type exports were removed after snapshot capture with verified identical
emitted runtime and strict type checks. Evidence:
`/tmp/slideshow-identity-final-capture.log`,
`/tmp/slideshow-identity-persistent-browser.log`,
`/tmp/slideshow-identity-pixel-proof.json` and
`/tmp/slideshow-identity-type-exports-proof.json`.

This slice exceeds the approximate 800-line review budget. Review map:

| Slice                                | Mechanical changes / scrutiny                                                                                  | Evidence                                                                 |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Thin routes and inferred query types | Move contracts/reads outside pages; scrutinize exact RPC arguments and unchanged URL resolver                  | Eight query units, strict types and exact RPC traces                     |
| Polling/selection/media/fullscreen   | Focused ordinary hooks; scrutinize identity reset, obsolete outcomes and atomic selection/cadence interactions | Eight formerly failing identity cases, 36 scoped units, 22 browser cases |
| Same-session preservation            | Shared view composition unchanged, no SCSS changes                                                             | Thirty-four exact DOM/style/geometry/RPC/PNG pairs                       |

Across phases6d–6g, **100 affected desktop/mobile browser cases** passed (58
catalogue,18 admin,22 TV,2 host identity). These are scoped checks, not completion
of the registered full suite. Next: TV owned SCSS/BEM, admin visible labels/focus
and owned styling, and legacy-host Challenges presentation. Remaining V2/legacy
migration, complete mocked-suite verification and final desloppify remain pending.

## Phase 6h — controlled legacy-host Challenges presentation

The legacy /admin Challenges tab composes ChallengeCatalogue, RoundChallengeList,
ChallengeListItem, SideChallengeList and SideChallengeItem. Small feature-private
presentation models carry ordered copy, state flags and callbacks. Admin retains
all queries/subscriptions, round ordering/current/scheduled/past projections,
completion counts, reveal/schedule commands, busy state and review URL construction.
Scores, players and live views are untouched; no styles or accessibility behavior
changed. This remains the legacy game-state workflow, distinct from V2 sessions.

Seven strengthened AdminV2 unit tests and **eight mocked desktop/mobile browser
cases** pass before and after extraction. The new legacy fixture correctly echoes
Realtime binding acknowledgements and uses a deterministic past date compatible
with its mocked auth session; failed fixture attempts are retained separately.

All **14 before/after pairs** preserve exact outerHTML without normalization,
controls, focus, scroll, geometry, standard computed properties and SDK traces
(independent initial GET order only normalized). Thirteen PNG pairs are exact;
one unchanged desktop Live progress edge differs by two pixels, maximum channel
delta3. All 232 style sources are identical. All 13 named existing actions, 49
existing top-level query/state/projection/helper declarations and the teams
subscription are byte-identical; two page presentation adapters are new. Immutable
846-file baseline/852-file after manifests and all 10 owned live files are verified.
Evidence: `/tmp/legacy-challenges-{parity-summary,controller-proof,source-proof}.json`.

Owned review load is **10 files, +928/−168 = 1,096 lines**, above the review nudge.
Review regression/Realtime fixture assumptions first; skim the proven markup moves
second; scrutinize the page's presentation flags/callback binding third. Remaining
legacy Admin concerns include team-read lifetimes/assertion, synchronous busy
locking, score/player/live layers and owned styles; none are claimed fixed here.

## Phase 6i — visible platform control labels and table semantics

Platform search/status now have visible native labels, and all seven table headers
have column scope with a named Actions column. Existing controls, placeholders,
options, handlers and behavior remain. The first shared FormLabel attempt inherited
12px text at weight 1000 control type; review rejected that unnecessary typography change. Native
wrappers preserve original16px text at weight 400 typography, line-height and color until the
separate shared-styling slice can compose primitives without drift.

Two new unit cases and both new desktop/mobile browser cases failed before the
markup change. All **23 scoped units and20 browser cases** now pass. Eight
before/after screenshot/computed pairs cover default/search focus/status focus/
filtered at 393/1280px, retaining native values/focus/placeholder and exact SDK
traces. Search keeps 46px height; select keeps 45px intrinsic height (desktop baseline
48px was stretch; mobile unchanged). Visible inline labels/equal wells intentionally
change arrangement and may wrap on mobile. All 232style and seven controller/
query/type/route modules are identical. No pixel-neutral visual claim is made.
Evidence: `/tmp/admin-labels-native-comparisons.json`,
`/tmp/admin-labels-native-live-proof.json` and the labels-native-after PNGs.
Review load: **four files, +118/−8 = 126 lines**. Keyboard focus still has the recorded
legacy outline:none treatment; shared toolbar styling and its separately tested
focus-ring fix remain queued.

## Phase 6j — shared native frame for legacy pages

Legacy join, gameplay, missing-player/loading views and leaderboard compose the
shared PageFrame native main/div boundary. Caller layout classes remain unchanged
in this extraction; owned layout/token migration follows separately. The public
local frame reference uses div to avoid nesting main and mounts no connected
controller. Native props/children pass through; no queries, state, navigation or
persistence live in the frame. Removed explanatory JSX labels and replaced two
error non-null assertions with equivalent explicit truthy guards while touching
those routes; interaction contracts and query order remain unchanged.

All **six mocked desktop/mobile legacy browser cases** pass before/after, covering
native join validation, missing-player recovery, ledger scores and leaderboard
navigation/filtering. Existing Game/participation/page-integration units pass.
All **14 desktop/mobile join/error/missing/game/team/player/history state pairs**
are pixel-exact and preserve DOM/control values/focus/geometry/all standard computed
properties, normalizing only the new page-frame class. Evidence:
`/tmp/legacy-pages-{before,after}-styled-*`, `/tmp/legacy-frame-{before,after}-browser.log`
and `/tmp/legacy-frame-pixels.json`.

The integrated immutable checkpoint passes **470 unit tests**, complete lint/format,
upload-disabled production build, Playwright type checks and a forced strict
TypeScript rebuild. Snapshot source/config remains frozen during browser jobs;
live independent work continues. Final full-suite verification/desloppify and
remaining legacy/V2 styling are still required.

## Consolidated milestone — owned presentation styles and legacy Scores

Completed the verified TV, platform-filter and legacy-page styling work together,
plus the legacy Scores presentation boundary. This closes these subsystems rather
than opening another per-primitive phase.

| Subsystem        | Result                                                                                                                                                 | Verification                                                                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 TV styling    | Four owned BEM partials; shared counter/fullscreen/overline/note variants; 15 legacy selector arms retired                                             | 56 exact native/style/geometry/PNG pairs, including native hover/focus/active, local/default references; 22 browser cases; 36 focused units                                                        |
| Platform filters | ControlRow filters and FormLabel filter own the existing toolbar/control wells; seven legacy arms retired; local disabled/filtering example            | 14 exact DOM/style/geometry/SDK/PNG pairs at desktop/mobile and 599/600/601px; 22 browser cases; 23 scoped units                                                                                   |
| Legacy PageFrame | Stack/compact/loading layout uses existing rem spacing/content-width tokens; caller layout utilities removed; bare supports unstyled local composition | 20 exact DOM/control/focus/geometry/standard-style pairs, including loading/error; 19 PNGs exact, one player-board pair differs by seven pixels (max channel delta15); no pixel tolerance hides it |
| Legacy Scores    | Four controlled score views; Admin retains ledger, validation, sign/trim/ID rules, state and commands                                                  | 13 units, 16 browser cases and 20 pixel-exact full DOM/style/SDK/alert pairs; 13 action functions, 51 prior declarations and teams subscription unchanged                                          |

TV proof retains all 1,412 prior expanded SCSS groups, five shared runtime emits,
and 308 prior Button class outputs. Its 22 supplemental pairs preserve native
fullscreen interaction states and existing UI references, with no local backend
traffic. Remaining PlayerGame.css is byte-identical outside the retired TV section.
Platform proof retains all 1,553 prior expanded SCSS projections, 158 untouched
legacy arms and 52 existing ControlRow/FormLabel bindings. Its controller/query
contracts are unchanged. Root's independent PageFrame import and the two promoted
filter colors are explicitly recorded shared-file deltas in the TV live proof.

The first PageFrame conversion exposed the unlayered global h1 margin winning over
old utility spacing. The owned rule now preserves that heading cascade; it does
not silently replace it with the spacing scale. The first failed comparison is
retained. Existing Game/participation/page-integration units pass; the six legacy
join/game/leaderboard browser journeys passed around the preceding extraction.
This styling step additionally exercises all three layout variants, query loading,
errors and expanded score history. Font/width/spacing values remain rem-based.

Scores review load is 1,019 lines across nine files, above the review nudge. Review
regression/fixture contracts, mechanical four-view moves and coordinator adapters
separately. Three pre-existing group-role warnings moved unchanged and remain a
separate accessibility task. Existing base fixtures and HostPlanning.css are
unchanged by this extraction. The TV styling slice itself is 378 review lines;
combined milestone review must include all source and regression changes.

Evidence: `/tmp/slideshow-scss-*`, `/tmp/admin-toolbar-*`,
`/tmp/page-frame-owned-*` and `/tmp/legacy-scores-*`. The coherent integrated
checkpoint passes 476 unit tests, complete lint/format, upload-disabled production
build, browser type checks and a forced strict TypeScript rebuild. The later
PageFrame heading-cascade correction passes its final build/forced types/lint and
20 browser comparisons. New integration documentation is formatted separately.

The platform filter keyboard-focus follow-up is also complete. Two production
browser regressions failed on the old zero-outline fields; the two local cases
already had the styleguide-only fallback ring. The shared filter variant now uses
the existing focus-ring fragment for native keyboard focus, without a global
selector or control geometry change. All 26 platform browser cases and 23 scoped
units pass. Eight comparisons isolate changes to four outline longhands: default
PNGs remain exact and focused states show the intended ring. Pointer text focus
follows browser :focus-visible semantics; disabled local fields remain skipped.
Evidence: `/tmp/admin-focus-comparison.log` and `/tmp/admin-focus-comparisons.json`.

## Finish milestones at the 54e84f6 checkpoint

1. **Close active presentation migrations:** legacy host console styling is
   verified; legacy player styling has completed its 44-state comparison and
   shared-default checks; legacy admin styling and residual session helpers are
   finishing their own proofs/integration. Platform admin, TV and PlayerDemo
   presentation are committed. Host/player session architecture is delivered.
2. **Retire transitional styling:** finish the global/host furniture migration,
   replace the final active CSS imports and preserve effective native resets
   before removing Tailwind and its plugin/dependencies. Keep exact cascade order.
3. **Close verified behavior defects:** separately tested accessibility/focus
   repairs follow neutral slices. Do not mix new design, fabricated captions or
   backend contracts into structural/styling changes.
4. **Final audit:** reconcile migration exceptions and references, run the complete
   mocked desktop/mobile suite, lint, strict types, build and review load; then run
   the requested desloppify audit, address findings and perform final verification.

At that checkpoint, PlayerDemo layout and contrast choices were unresolved.
The subsequently approved preserve-design scope retains their current appearance. Native
media lacks a supplied caption/transcript contract; no fake content or new upload
feature is authorized by this migration. Live backend schema/policy/atomic awards
are not proven by mocked frontend tests.

## Legacy voting privacy and recovery

Open voting now takes precedence over a stale results-publication flag in Game,
Vote and VoteResults. The results route guards its render before navigation, so
unpublished rankings cannot appear for one React commit. Once voting closes,
published results become available again. A missing legacy voter returns to
`/legacy/join`; unrelated V2 participation credentials remain intact. This is an
explicit behavior repair, separate from the following presentation extraction.

The privacy/recovery checkpoint passes 47 focused unit regressions, ten mocked
desktop/mobile browser cases, full lint, forced strict TypeScript, browser types
and an upload-disabled production build. The before checkpoint fails the new
privacy and recovery cases. A React Profiler regression checks every committed
render for leaked result content. Evidence is in `/tmp/legacy-vote-privacy-*`,
`/tmp/legacy-vote-recovery-*` and `/tmp/legacy-routing-*`; the tested source is
`/tmp/chaos-legacy-player-routing-after`. No host payload or backend contract changes.

Historical completed parity JSON has been archived losslessly to reclaim disk:
200 files, 3,743.2 MiB original, 314.1 MiB compressed, 3,429.1 MiB reclaimed.
Each decompressed SHA was verified before removal; restoration paths and hashes
are recorded in `/tmp/historical-parity-json-archive.jsonl`. Screenshots and proof
scripts were retained. This does not replace any pending verification.

## Legacy player presentation boundary

LegacyJoin now adapts navigation to a focused join controller and a controlled
LegacyJoinView. Ballot and SubmissionCard retain their existing external concerns
while delegating markup to controlled BallotView and SubmissionCardView.
VoteResultsView receives already-guarded published projections. SideChallenges
composes BingoChallengeCard; its presentation contract now exposes only the six
participation values/actions it uses. Existing local participation examples no
longer fabricate unrelated hook fields. Local legacy player screens demonstrates
join, ballot and result views without connected controllers or backend access.

This slice preserves existing utility classes; their owned styling migration is
next. It does not claim to finish the legacy player subsystem. The legacy join
async lifecycle remains unchanged and needs its separate regression-first review.

Verification: 32 desktop/mobile states have exact DOM including text-node
boundaries, every computed property, rectangles, focus, native values and ordered
write payloads after normalizing only the existing PageFrame root class mapping.
31 screenshots are pixel-exact; desktop Players differs at seven glyph-edge pixels
inside a 2-by-8 rectangle. No image tolerance is used. Initial comparison exposed
a mid-hover-transition capture; the retained failed run led to recapturing both
sides with the pointer moved away and finite animations settled.

All 30 scoped browser cases pass, including completion rollback/retry, exact
player/team vote writes, team-award draft retention/retry and the backend-free
local reference. A first mobile test inspected optimistic completion before the
second write reached the fixture; it now waits for the actual ordered commands.
The coherent integrated source checkpoint passes all 526 unit tests, forced
strict app types, browser types and upload-disabled build. JavaScript/SCSS lint
passes; the concurrent admin files still awaited their final formatting when
that live lint run sampled them. Proof: `/tmp/legacy-player-controlled-*`, source
`/tmp/chaos-legacy-player-controlled-final`; baseline overrides are explicitly
hashed in `/tmp/chaos-legacy-player-controlled-before/controlled-baseline-overrides.json`.

The current combined in-progress review load is 8,275 lines across 115 files
(+6,451/-1,824), before later test/catalog additions. This exceeds the review nudge.
Review separately: player controlled markup moves and narrow props (mechanical,
32-state proof); new fixture/browser contracts (human scrutiny); local examples
(no backend); legacy host controller/command behavior; admin owned styling; and
slideshow extraction/styling versus explicit end/playback behavior fixes. Full
milestone maps remain required as the other subsystems finish.

## Legacy host architecture milestone

The legacy /admin route is now an adapter to LegacyHostWorkspace. Controlled
Live/Players/frame/header/navigation views receive presentation values and
callbacks. Focused game, roster, score and team controllers use typed inferred
legacyHostQueries/legacyHostCommands boundaries and keep the existing SDK
payloads, subscription order and HostV2 appearance. Existing fixtures are intact.

Separately tested behavior repairs add synchronous action exclusion (per player
where independent player operations may overlap), obsolete-result guards, latest
team-read ownership and ordinary runApi exception recovery. A listener setup
failure is reported and cannot be erased by a successful read. Initial evidence
had 15 lifecycle failures and four API exception failures; final focused coverage
passes 47 units. Thirty mocked desktop/mobile browser cases pass, with the final
text-node-only correction additionally checked by the parity comparator.

All 32 final states match the original in outerHTML, child text boundaries,
native values, focus, scroll, geometry, every standard computed property and SDK
trace. An initial 1/64-pixel width mismatch exposed merged JSX text nodes; keeping
the original segmentation fixed it without tolerances. Twenty-seven screenshots
are pixel-exact; five have two changed progress-edge pixels with maximum channel
delta three. Evidence: `/tmp/legacy-host-milestone-parity-summary.json`,
`/tmp/legacy-host-milestone-parity-text.log`, final source
`/tmp/chaos-legacy-host-final-text-parity`. Upload-disabled build passes.

Review pressure: 3,990 relevant lines across 29 owned files (+2,976/-1,014).
Review map: regression fixtures/contracts; mechanical controlled markup/models
(32-state parity); focused typed persistence/controller boundaries (payload and
subscription scrutiny); explicit lock/lifetime/error changes (guard/finally
scrutiny and red-before tests). Owned SCSS migration follows separately; this
architecture slice does not claim the legacy host styling is complete.

## Legacy join obsolete-response repair

A pending legacy join no longer writes a credential, navigates or displays
feedback after leaving its controller. This prevents an older creation response
from replacing the identity saved by a newer join. Existing synchronous submit
exclusion and retrying the same created player after storage failure are retained.
This explicit behavior slice follows the verified neutral extraction.

Two unit regressions failed before the repair; the storage/repeated-submit
preservation case already passed. All 28 scoped units now pass. Both new browser
regressions failed before by redirecting from Leaderboard to Game; all 16 workspace
browser cases pass after the repair. Forced app types, browser types and the
upload-disabled build pass. Lint source gates pass; a generated snapshot-only
proof JSON initially needed its trailing newline formatted before the final gate.
Evidence: `/tmp/legacy-join-lifetime-*`; browser source
`/tmp/chaos-legacy-player-lifetime-after`. The checks copy documents its sole
test-type correction (unsupported Testing Library option removed); app/browser
sources are identical. No player payloads, storage keys or backend contracts change.

## Completed platform, playback and demo presentation

Platform administration now composes shared headings, statistics, panels, native
DataTable, row actions and the native inspector dialog. All remaining 32 sa-*
selector arms are retired. Its controlled local reference exercises notices,
loading, pending writes, inspector/retry and intercepted navigation without a
backend. Both independent 34-state desktop/mobile comparisons match all native
DOM/text/attributes/focus/geometry/computed properties/RPC order and pixels.
Both 28-case browser runs pass, as do 23 focused units and live types/lint/build.
A neutral import cleanup exposed a retained mobile-navigation override; keeping
HostPlanning imported preserves its four-column grid until that owner migrates.
Sources/evidence: `/tmp/admin-presentation-handoff.md`,
`/tmp/chaos-admin-presentation-curated`, `/tmp/admin-presentation-*`.

Legacy playback now has controlled views, shared playback/empty/unavailable
components and owned SCSS. The route adapts host/navigation to focused feature
controllers. End commands have separately tested synchronous exclusion and host
lifetime guards; actual native playback clears blocked-play feedback. The six
new behavior regressions failed first. All 52 browser cases and 24 units pass;
34 states match DOM/styles/geometry/focus/read/write contracts. Nonvideo
screenshots are pixel-exact; six native video states retain inspected buffering,
control-fade or progress timing differences. All 1,469 prior compiled rules and
53 existing shared markup contracts remain exact. Five-second image cadence,
video audio/controls, keys, media URLs and index reconciliation are preserved.
Missing captions remain a real content-contract concern, without fake tracks or
new upload UI. Evidence: `/tmp/legacy-slideshow-handoff.md` and its linked proofs.

PlayerDemo retains its existing phone composition, local state, uploads/votes,
semantic icons and seven tour targets. Demo-specific styling now lives in 23
owned BEM component/route blocks; PlayerGame.css shrinks from 1,380 to 90 lines
of retained V2 helpers/spinner. All 64 states at widths 393/420/481/1280 match
DOM/every computed property/geometry/focus and pixels exactly. All 12 browser
cases pass; 148 compiled selector/media projections and 14 retained legacy rule
bodies match. Its pending layout choice is not silently treated as approval for
a redesign. Evidence: `/tmp/player-demo-handoff.md`,
`/tmp/player-demo-curated-source-proof.json`, `/tmp/chaos-player-demo-owned-after`.

Review these large milestones in separate slices: platform frame/stat primitives;
native table/actions; inspector; local platform reference; slideshow controlled
markup; slideshow owned styling/token promotions; separately tested end/playback
behavior; demo class renames; demo CSS retirement and BEM/token moves. Mechanical
parity supports the neutral slices; native video timing and explicit async guards
need the stated human scrutiny. Tests and fixtures remain part of review load.
Root integrates tested blobs in the index without replacing peers' live files;
a source snapshot of that exact staged tree must pass integration gates before
commit. Current host/player style migrations and legacy administration remain
outside these completed milestones.

The exact proposed platform/playback/demo integration tree now passes all 529
unit tests and all 92 scoped mocked desktop/mobile browser cases, forced strict
app types, browser types, full lint and the upload-disabled build. Source is
`/tmp/chaos-completed-presentation-index-final`; per-file staged provenance is
`/tmp/completed-presentation-staged-provenance.json`. Its only correction from
the browser-served index copy is formatting HostPlanning.css; no declarations
or source behavior changed. The completed staged delta is approximately 6,700
review lines across 100 files; use the slice map above rather than reviewing it
as one undifferentiated change. Unfinished peer changes remain in the worktree.

## Legacy administration presentation boundary

The /admin-legacy route now adapts to a feature workspace, controlled eight-tab
frame/navigation and controlled player/team/voting/participation/review views.
Name editing and score operations have focused controllers. Existing read hooks
and command callbacks retain their query/payload/order/error contracts; Tonight
and challenge cards receive callbacks instead of importing persistence/navigation.
The typed team-create boundary deliberately preserves SDK result/error identity
and transport rejection for the original controller catch. No runApi recovery,
new validation, styling or accessibility changes are mixed into this extraction.

All 67 scoped units and 14 mocked desktop/mobile journeys pass. All 28 captured
states match native DOM without any normalization, every computed property,
focus/geometry and pixels exactly. Reads preserve full query/body/count sets;
journeys assert write ordering. Sources: `/tmp/chaos-legacy-admin-baseline-v3` and
`/tmp/chaos-legacy-admin-extracted`; scope/evidence/known retained label and
lifetime concerns: `/tmp/legacy-admin-next-review.md` and
`/tmp/legacy-admin-extraction-comparison.json`. Styling follows separately.

The proposed legacy-admin structural tree additionally passes all 531 integrated
unit tests, forced strict types, full lint and upload-disabled build. Exact source
copy: `/tmp/chaos-legacy-admin-neutral-index`. Review load for this slice is 1,630
lines across 29 files (+1,165/-465), above the nudge: review controlled native
markup moves (28-state exact proof), focused controller extraction, exact team
SDK boundary (payload/error scrutiny) and browser fixtures/contracts separately.
The working-tree review command also includes unfinished host/player/status and
admin styles; it is not evidence that those slices are complete.

## Legacy player owned presentation

Legacy join, gameplay/status/main and bingo challenges, voting/results, review
and leaderboard now use owned BEM SCSS instead of utility styling. Shared
BrandArtwork and ScreenIntro remove repeated page furniture; ChoiceOption ballot
retains native option markup, StatTile legacy variants share the statistics,
ContentPanel challenge shares the bingo/admin shell, and PageFrame content owns
result-loading geometry. Controlled ChallengeReviewHeader and PlayerRecovery
keep route parsing/navigation out of presentation. Existing labels, values,
keyboard actions, native form/media attributes and privacy/score contracts remain.

Forty-four desktop/mobile states have exact class-normalized native DOM/text,
all computed styles, rectangles, focus and ordered write payloads. This includes
loading/rejoin/missing-player/invalid-review branches. Forty-two screenshots are
pixel-exact; mobile Players has 23 edge pixels with maximum channel delta one,
and desktop Players has seven glyph-edge pixels with maximum delta 15. Both
were inspected; no image tolerance is used. The first history comparison caught
unpainted side-border colors previously set by Tailwind; all four are retained.
The final shared bingo shell additionally passes both game-state comparisons.

All 1,630 prior compiled SCSS selector/condition/declaration projections and
208 existing shared native markup contracts remain exact. Local examples now
show shared introduction/statistics/award fields and the native content frame,
without backend access. Existing low contrast and media-caption limitations are
preserved for the separately authorized/verified follow-ups, never suppressed.
Evidence: `/tmp/legacy-player-owned-v2-*`, `/tmp/legacy-player-owned-final-*`,
`/tmp/chaos-legacy-player-owned-final` with explicit per-file overlay provenance.

Review map: shared primitive variants and defaults; existing-value token/type
fragments; mechanical owned BEM conversion by component; controlled recovery and
review header extraction; local references/catalog. Native media/labels and the
initial query/error branches deserve scrutiny; the full rendered comparison
supports the neutral changes. Full integration gates and review-load figures
are recorded at commit. Remaining historical completed parity JSON archive now
also includes 67 verified files (102.1 MiB to 2.6 MiB), with restoration/SHA journal
in `/tmp/historical-parity-json-archive.jsonl`; active proof files were retained.

Final legacy-player styling gates pass: 531 integrated units, all 32 mocked
browser journeys, forced app/browser types, full lint and upload-disabled build.
The source-only scope at final review checkpoint is 57 files, +973/-233 = 1,206
relevant lines, above the nudge; the shared/default, component conversion,
controlled extraction and reference slices above form its review map. The full
working-tree review command reports 6,765 lines across 198 files because it also
includes independent unfinished milestones; it does not measure this slice alone.

## Finishing plan implementation

Resumed the approved finishing plan from 54e84f6. Scope includes repository-wide
confirmed cleanup findings; current designs/colors remain, with targeted visible
labels and focus repairs permitted. No new runtime dependencies, deployments,
live backend writes or schema changes are authorized. The initial current-source
checkpoint passes 546 units, forced strict types, full lint and production build.

Default Playwright discovery now includes every mocked spec and explicitly
excludes tests/live. The opt-in live configuration overrides that exclusion.
Read-only discovery proves 598 mocked cases across 39 files and 40 opt-in live
cases across three files; no live journeys were executed. This closes the three
previously omitted host foundation, roster-focus and pending-team specifications.
Subsequent new mocked specs are discovered automatically.

## Consolidated remaining neutral presentation

The verified console, legacy administration and participant-helper styling slices
are assembled from their frozen source blobs. Accessibility changes remain in
separate working-tree overlays. Console proof covers40native/style/geometry/SDK
states and30production+2localbrowsercases; its focus paint outlier and stable
recheck remain documented. The independent24state Field probe also proves default,
comic and actual access controls unchanged; :where keeps specificity0,1,0.

Legacy administration proof covers42exactDOM/style/focus/geometry/pixelpairs and
16browsercases. Shared NativeSelect/UploadInput and local eight-panel examples
retain native contracts. Participant helpers cover26exactDOM/style/geometry pairs
and60browsercases; seven screenshots differ only at two unchanged titlebar-edge
pixels. All14legacy helper/spinner rules and PlayerGame.css imports are retired;
existing1second and0.8second icon animation contracts remain distinct.

The proposed integration checkpoint passes534units and strict app/browser types.
Eight old snapshot files needed formatting; all eight transpile to byte-identical
runtime JavaScript. Shared/token/index unions preserve committed player work.
Handoffs: /tmp/legacy-host-style-handoff.md, /tmp/legacy-admin-style-handoff.md,
/tmp/session-helper-handoff.md. Proposed-source provenance is
/tmp/finishing-neutral-staged-provenance.json. Review slices are console primitives
and owned blocks; admin primitives/native bindings; participant status/spinner
retirement; local references/catalog; existing-value token promotions; and
regression fixtures. Review native prop forwarding/cascade carefully; command and
query behavior remains unchanged in these neutral slices.

The corrected neutral union passes strict app/browser types, full lint, production
build and534units. One omitted verified motion token was restored before rerunning
Sass/build; the failed draft and stopped browser run are retained, not counted as
passes. The corrected full mocked suite is running from
/tmp/chaos-finishing-neutral-corrected with no live tests. At this checkpoint its
completed journeys pass; final total/result will be recorded after termination.
The neutral delta is137files,+4420/-746=5166reviewlines before final report text.
Use the six review slices above and separate later accessibility/async changes.

Completed historical phase JSON was losslessly archived to keep verification
space available:2210files,5634.8MiB→401.2MiB,5233.6MiB reclaimed. Every decompressed
SHA was verified before unlink and recorded in the restoration journal. Active
snapshots and current proof files were excluded.

Browser startup is now bounded by the configured120s process timeout: supported
webServer.wait.stdout waits for Vite's Local readiness line instead of performing
an unbounded HTTP availability probe before launch. strictPort, baseURL and
live-test isolation remain. Installed runner source proves the old probe lacked
a socket deadline; no proxy or network-policy change is needed. A temporary
config over unchanged source started Vite in about300ms and passed the mocked
join journey in3.3s. Evidence: /tmp/finishing-neutral-startup-diagnosis.md and
/tmp/finishing-startup-smoke.log. Existing running snapshots were not modified.

The consolidated neutral checkpoint is now fully verified: all576 default mocked
browser cases pass (desktop/mobile,16.4minutes), alongside534units, lint, forced
application/browser types and production build. No live backend was used.

## Finishing accessibility behavior

A separate slice exposes score-choice pressed states, retains the pending team
creation action name/busy state, restores roster focus after confirmed removal,
and associates expandable legacy score history with its current rendered target.
These changes preserve operation payloads and existing appearance. Regressions
failed before repair; the integrated slice passes541units,14focused desktop/mobile
browser cases, strict application/browser types, full lint and production build.
Score10pairs and history10pairs preserve computed styles, geometry and pixels;
only intended ARIA/IDs differ. Roster tests cover real mocked DELETE/Realtime,
failed/cancelled operations and leaving the roster without focus theft.

Review map: native disclosure/pressed semantics; the focused DOM-only roster
recovery hook; stable pending action naming; deterministic regressions/fixtures.
Review focus recovery conditions and intended ARIA changes. No palette changes,
new dependencies or persistence behavior are included. Evidence:
/tmp/shared-a11y-finishing-handoff.md, /tmp/leaderboard-aria-pixels.json,
/tmp/finishing-a11y-{unit,browser,types,pwtypes,lint,build}.log.

## Legacy administrator native labels

Existing pub/challenge/minutes/player controls now associate their visible text
with native controls. Team name and Vote for add the two approved visible labels.
Their flow shifts32px and28px respectively; fonts, colors, bounds, placeholders,
callbacks and native control types remain. Twelve before/after comparisons retain
control geometry/styles and command contracts; eight unaffected views are
pixel-exact. Five component and four browser regressions fail before the repair.
The isolated integrated label tree passes546units, forced app/browser types,
full lint and production build. Browser outcome is recorded below on completion.
Evidence: /tmp/legacy-admin-behavior-handoff.md and
/tmp/legacy-admin-label-comparisons.json. This behavior slice is separate from
both neutral styling and the subsequent async lifecycle guards.

The prior accessibility checkpoint's source delta was16files,+781/-7;
the review command also included unfinished independent styling work and reported
105files,+3474/-738=4212lines. Use its four-part review map above rather than
interpreting that combined number as a single small patch.

All20 isolated integrated label browser cases pass at393/1280. The label slice
contains seven source/test files,+321/-6 before this evidence note; review native
associations and the two intended visible-label flow changes.

## Legacy administrator operation lifetimes

A separate controller-only repair scopes late feedback/navigation/reloads to the
mounted tab generation and keeps fresh synchronous locks independent of old
responses. Player assignments and removals retain per-player concurrency. Issued
requests may complete; the client does not roll back writes. Twenty-five focused
regressions cover stale slideshow navigation, tab/form races, transport recovery,
duplicate voting and independent player operations. Twelve steady-state pairs
are exact for DOM, styles, focus, geometry, pixels and query multisets; twelve
SDK argument ASTs and four persistence modules retain their original bytes/order.
The isolated integrated tree passes571units, forced app/browser types, full lint
and production build. Focused desktop/mobile browser completion follows below.
Evidence: /tmp/legacy-admin-behavior-handoff.md,
/tmp/legacy-admin-lifecycle-parity.json and
/tmp/legacy-admin-command-payload-proof.json.

This slice is15files,+1022/-43=1065review-relevant lines before documentation.
Review map: focused lifetime/operation hooks; current-tab command guards and
navigation; per-player mutation locks; before-failing deferred-response fixtures.
Scrutinize scope generation, fresh-lock release and confirmation/error branches;
steady-state presentation and issued persistence payloads are mechanically proven.

All36 isolated integrated admin browser cases pass at393/1280, including deferred
response races and unchanged label/workflow/local-reference journeys. The complete
working-tree review command reports unfinished independent changes as well; its
numbers are retained in /tmp/finishing-admin-lifecycle-review-load.log.

## Final host and global presentation ownership

Host furniture now composes shared workspace variants and FeedbackNotice,
HostDirectory and PlusMark blocks. Route shells retain arrangement; the remaining
HostPortal, HostTheme and HostPlanning files/imports are retired. Global font/base
rules move to owned SCSS while the native Tailwind reset remains temporarily for
the subsequent independent removal slice. The loading shell uses PageFrame;
ScheduledCountdown owns its final tabular-number styling. No utility consumers
remain in maintained runtime markup (388TSXfiles/1038classattributes audited).

Fourteen compiled global rules and font/import contracts are exact. Corrected
host comparisons preserve actual account/hub/planning/catalogue/saved/join/loading
states at393/800/1280. Twelve account pairs are pixel-exact. Local Foundation
page-height/pixels differ with added reference content; these raw differences are
retained rather than claimed neutral. Inert navigation grid declarations are
explicitly removed: navigation remains flex/hidden at their breakpoints. The
corrected directory/account mobile selector retains the original context.
Evidence: /tmp/host-furniture-corrected-parity-summary.json,
/tmp/host-furniture-login-proof.json and /tmp/host-foundation-all-neutral-paths.json.

The isolated assembled neutral tree passes571units, forced app/browser types,
full lint, production build and16mocked foundation/hub browser cases. The separate
full-current keyboard snapshot passes575units and28account/hub/foundation/local
browser cases, app/browser types and build; its countdown formatting failure was
corrected in the neutral assembly without a runtime change.

Review map: existing-value global/font tokens; shared workspace/native props;
owned directory/decoration/furniture blocks; route arrangement and CSS retirement;
backend-free local reference; counted runtime utility audit. Source delta before
documentation is63review-relevant files,+1010/-682=1692lines. Scrutinize selector
contexts and native prop/default behavior. Reset/tooling removal and tab keyboard
changes remain separate slices; the whole-tree reviewer load includes both.

## Host account and workspace keyboard contracts

Account and dashboard tabs now have stable linked IDs, one selected tab stop,
wrapping arrow/Home/End activation and named panels. The account panel wraps the
unchanged native form; the dashboard uses its existing games section. Read-only
preview parameters and ordinary routing remain. Controlled local account and
workspace references demonstrate the same behavior without auth/storage/backend
reads or writes. Shared tab-handler extraction preserves its original AST.

Actual keyboard regressions failed before repair. All28 integrated desktop/mobile
account, dashboard, hub, foundation and local-reference cases pass against
/tmp/chaos-finishing-host-keyboard-current. Its575units, forced app/browser types,
JS/SCSS linters and production build pass. The only formatting failure was the
unrelated countdown source, corrected and passing in the neutral commit. Twelve
account appearance pairs remain pixel-exact; dashboard native focus is exercised.
Evidence: /tmp/host-keyboard-integration-handoff.md and
/tmp/finishing-host-keyboard-{unit,browser,types,pwtypes,lint,build}.log.

Review native form/panel semantics, focus order, preview routing and local demo
isolation. Twelve source/test/catalog paths change; this behavior slice follows
the neutral furniture commit and does not include native reset/package removal.

## Native reset ownership and Tailwind retirement

The application now imports only scss/style.scss. Its owned, licensed native reset
preserves the previous theme/base layers and canonical layer order; seven theme
default declarations and49base rule projections are mechanically equivalent.
All66 same-source before/after states match raw DOM/native attributes/text,
focus, geometry, every standard computed property, SDK traces and every PNG pixel
at393/800/1280. Equivalent pseudo-element spelling and duplicate identical compiled
declarations are the only compilation normalization. Evidence:
/tmp/preflight-parity-summary.json and /tmp/preflight-compiled-proof.log.
The final Directorysubtree comparison additionally matches all three widths and
full-page screenshots exactly: /tmp/host-directory-final-comparison.json.

Both Tailwind packages and the Vite plugin are removed after the zero-consumer
runtime audit. Offline npm removal used ignore-scripts, removed14packages and
reported zero audit vulnerabilities; npm ls confirms neither package installed.
No dependencies were added. Current575units, forced app/browser types, full lint
and upload-disabled production build pass. AGENTS/README/catalog now describe
owned styles, accurate command boundaries and backend-free examples; silent
geometry comments compile byte-identically. Final all-journey browser verification
will follow the fresh repository-wide cleanup audit and confirmed repairs.

Review map: preserved native reset/license and theme defaults; stylesheet/plugin
entry retirement; package/lock removal; current guidance/catalogue contracts;
comment-only runtime geometry notes. Scrutinize reset/cascade ownership and final
package changes; the66state comparison mechanically proves current appearance.

## Closing audit and legacy review protection

The fresh repository-wide scan and20 isolated blind review batches completed.
The first scan's npx duplication detector failed; a complete rerun used the
already cached jscpd executable (no dependencies added). All20 review batches
imported successfully. Its automatic follow-up scan correctly refused an active
queue; no partial rerun is claimed. Triage consolidated23 current review findings
into bounded area clusters. Duplicate type/timer/unused-launch findings share
repairs. The flat-directory concern is accepted explicitly: existing named
workflow controllers already express boundaries; moving files solely for a count
would not fix the actual timer ownership problem. External backend policy/live
journey obligations remain unresolved, never marked frontend-proven. The triage
organizer's unavailable python command was rerun with python3; validation and
explicit decision ledger are complete before implementation.

The existing /challenge-review route now uses HostGuard alongside the admin
routes. Anonymous navigation cannot mount award reads/controls; signing out
unmounts review. Authenticated query parameters, award drafts, evidence and exact
award commands remain. Two new unit cases and desktop/mobile browser cases fail
before repair. The isolated slice passes577units, strict app/browser types,
full lint, production build and8affected browser cases. This is frontend route
protection, not evidence of deployed legacy database authorization.
Evidence: /tmp/legacy-review-auth-{unit-red-complete,browser-red,allunit,types,
pwtypes,lint,build,browser-green}.log. Review the guard membership and the updated
anonymous smoke expectation; active authenticated workflows are unchanged.

## Remove obsolete alternate launch orchestration

Deleted the375-line launchHostGame module after repository source/test/script/doc
reference checks found only its own exported declaration. The active dashboard
launch remains createOrGetHostGameSession; routed legacy controllers remain.
This removes an unused alternative global-table write path, not a live backend
migration. No tests were added solely for deleted code. The isolated slice passes
full lint/build and four mocked desktop/mobile dashboard listing/failed-launch
journeys. Evidence: /tmp/dead-launcher-reference-proof.txt and
/tmp/dead-launcher-{lint,build,browser}.log. Its source diff is one375-line deletion.

## Evidence format normalization

Evidence preparation uses one canonical extension/MIME map, ordered MIME matching
and explicit media-type decisions. Removed the redundant combined whitelist and
deep conditional chain. All29376 before/after filename/MIME/size combinations are
exact, including mobile empty MIME, conflicting formats, uppercase inputs and
size boundaries. Upload/storage/registration code remains byte-identical. Direct
registration coverage now includes assignment-linked evidence and exact participant
credentials/assignment ID; format regressions retain3gpp2-before3gpp precedence.

The isolated slice passes593units, strict app/browser types, full lint/build and
four desktop/mobile inline-upload/evidence-review journeys. Evidence:
/tmp/evidence-format-parity.json, /tmp/evidence-command-tail-proof.json and
/tmp/evidence-format-{allunit,types,pwtypes,lint,build,browser}.log. Review map:
canonical supported formats; ordered fallback decisions; exact assignment payload
coverage. Source delta is two files,+135/-181=316review-relevant lines; no UI or
storage path/RPC changes are included.

## Small core boundary cleanup and audit accounting

Bootstrap now checks the existing root element explicitly. Leaderboard map creation
and get/create narrowing replace the two remaining runtime non-null assertions
and the empty event-array assertion. Four thousand deterministic scoring cases
match exactly (duplicate/missing IDs, personal/direct-team events, ordering and
invalid/negative/zero points). PlayerAccessView references the public mascot with
the configured base URL instead of importing public as a source module. Nine
native image renders at393/800/1280 match original bytes, dimensions, computed
styles and pixels in baseline dev, updated dev and updated production preview;
bootstrap has zero page errors. Isolated593units, strict types, lint/build pass.
The initial asset harness lacked Chromium's required library environment; its
infrastructure log is retained and is not counted as an application failure.
Evidence: /tmp/leaderboard-assertion-parity.json, /tmp/core-public-asset-proof.json,
/tmp/core-boundaries-{allunit,types,lint,build}.log. Source diff: three small files.

Audit history populations were reconciled rather than treated as code regressions.
The current complete scan covers720files, including564production-classified files;
the old142-file checkpoint and deliberately reset subjective placeholders are not
comparable score baselines. Current117historical skip occurrences represent107
unique issues plus10repeats;107unique split into76currentlyskipped and31no-longer
skipped. Thus the historical116-vs75 gap of41 is10repeats+31removed entries, with
zero current entries missing history. Current kinds are38false-positive and38
permanent; work-item status totals are a different population. Evidence:
/tmp/finishing-audit-state-accountability.json. A review re-import not reporting
an old finding is never accepted as deployed policy/live-journey verification;
those real external limitations remain unverified in this report.

## Live saved-plan validation and recovery

A separate seven-file slice narrows consumed persisted plan fields, isolates plan
read identity/error/reload state, and preserves unknown root/task metadata and
order during a valid challenge patch. Malformed metadata never gets overwritten
after a successful live challenge save; the existing partial-save warning remains.
Obsolete/rejected reads cannot replace another plan; successful session polling
cannot erase a failed command or the independent plan error. The coordinator adds
only that feedback channel in this slice; voting/timer wiring follows separately.

Regression-first plan/read/editor cases pass. The isolated assembly passes615units,
forced app/browser types, full lint/build, two existing break-preview checks and
six actual editor/modal-error desktop/mobile cases. Evidence:
/tmp/live-host-phase3-handoff.md, /tmp/live-plan-only-{unit,types,pwtypes,lint,build,
browser,editor-browser}.log. Review read projections, lossless write guards and
identity/error precedence separately from tests. Source delta is7files,
+668/-74=742review-relevant lines before this note; the live workspace's newer
named-command and timer overlays are intentionally excluded from this commit.

## Shared host participation recovery

Participation owns recovery of an actual usable host-player token. Reward, final
and secret voting retain phase guards, payloads and destination callbacks, using
that operation rather than repeating join/storage decisions. Failed joins return
failure and preserve their specific message; no vote follows a missing token.
The coordinator defers callback lookup through wrappers because participation is
initialized after the voting hooks. Credential storage keys and inline host play
remain unchanged.

The isolated eight-file integration passes630units, app/browser strict types,
full lint/build and six reward setup/award browser cases; the broader coherent
participation milestone also passes59focused units and74desktop/mobile cases,
including credential recovery and all eight assignment-specific upload/submit
checks. Root final whole-runtime gate passes738units; the complete664-case browser
run is in progress. Evidence: /tmp/live-credentials-*.log and
/tmp/live-host-phase3-handoff.md. Source delta before this note is8files,
+374/-57=431review-relevant lines. Review participation outcomes and phase-specific
navigation separately from the exact payload/error assertions.

## Assignment-specific submission regressions

Added controller and mocked native keyboard coverage for assignment-linked image
and video uploads, required-evidence isolation, pending-write locking, refusal
while final review is active, failed submit and successful retry. Exact join code,
player token, challenge/assignment IDs, generated storage path and registration
payload are asserted. The backend fixture now validates and implements the existing
secret-submit RPC; its earlier unsupported-handler failure was a fixture gap,
not proof of a production defect. Production submission code is unchanged.

All eight new desktop/mobile submission cases pass inside the74-case participation
run; relevant controller tests and the738-unit final runtime pass. Direct library
assignment registration coverage shipped separately in348949d. Three test/fixture
files add510raw lines; review the independent assignment/credential assertions and
fixture state update, not a new backend contract. No live writes or schema claims.
Evidence: /tmp/live-host-phase3-handoff.md and
/tmp/live-host-phase3-after-browser.log.

## Clock and round-transition ownership

The timer owns snapshot parsing/serialization, synchronous clock storage, one-second
ticks and serialized publication. Session actions own transition decisions,
override prompts/autoplay state and expiry outcomes through concrete clock
operations. Circular callbacks/raw timer setters/latch access are removed; reset
pauses and restart runs. Existing manual expiry recovery is preserved, not newly
invented. Rejected transitions now release their lock and surface feedback.
Fractional lobby steps and invalid saved resume targets recover to the existing
valid/fresh paused state; valid future round targets and supported elapsed-time
semantics remain intact.

Verified:36focused regressions,680frozen whole-tree units/build,28desktop/mobile
cases and8exact DOM/all-computed-style/geometry/pixel pairs. The baseline passes24
browser cases and fails4targeted corrupt-storage cases; its manual expiry recovery
already passed. SDK expression/order proof and all302SCSS bytes remain exact.
Evidence: /tmp/timer-flow-handoff.md, /tmp/timer-flow-source-proof.json,
/tmp/timer-flow-parity.json. Review map: clock serialization/timing; transition
ownership/explicit outcomes; semantic callback migration; malformed hydration;
regression fixtures. This subsystem exceeds the800-line reviewer nudge; inspect
behavior guards separately from mechanically proven neutral wiring. Root's final
whole-runtime gate passes738units/types/lint/build; full browser run continues.
