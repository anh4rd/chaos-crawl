# AGENTS.md

Instructions for coding agents working in Chaos Crawl. Keep project guidance here; do not duplicate it in tool-specific instruction files.

## Overview

React 19 + Vite SPA in strict TypeScript for Anna's Chaos Crawl: hosts plan and run events; players join, complete challenges, upload evidence, and vote. Supabase supplies authentication, database queries, RPCs, storage, and Realtime. Sentry reports frontend errors.

The production base is `/chaos-crawl/`; routing uses `HashRouter`. V2 uses `/join`, `/play/:joinCode`, and authenticated `/host` routes. Legacy workflows remain at `/legacy/join`, `/game`, and `/admin-legacy`. Preserve both contracts during refactors. `/styleguide` is the public, local-state component reference.

## Non-negotiables

1. **Strict TypeScript.** Keep TS/TSX, existing compiler checks, and explicit domain contracts. Do not introduce `any`, broad assertions, or non-null assertions to silence a problem. The existing dynamic V2 Supabase boundary in `src/lib/sessionSupabase.ts` is a documented migration exception, not a pattern to spread. Database contracts inferred from queries are not verified deployed schema types.
2. **English inline strings.** No translation framework or string catalogue.
3. **SCSS and global BEM classes.** New and migrated styling belongs in `scss/`. No CSS modules, CSS-in-JS, styled components, or new Tailwind usage. Static design values never go in JSX `style`. Runtime geometry and data-driven CSS custom properties are allowed for measured positioning, progress, and calculated animation values; document the boundary in the consuming style.
4. **Design values come from tokens.** Reuse an existing token, derive from it, or promote an existing design value without changing its appearance. New colors or intentional design changes require user input. Structural values such as `0`, `auto`, `100%`, and unitless ratios do not need tokens.
5. **Ask before adding dependencies.** Sass and Stylelint tooling are authorized for this migration. No new runtime dependency is authorized by this document. Prefer native controls; if an interaction needs a library, propose the specific dependency before installing it. Do not add state-management libraries.
6. **Accessibility is required.** Enforced accessibility rules are errors. Never suppress them to bypass a defect. Use native controls, visible labels, correct ARIA, keyboard operation, and visible focus. Walk the entire interaction keyboard-only before claiming a fallback works. Accessibility behavior changes belong in separate, explicitly tested slices from structural refactors.
7. **The styleguide is the contract.** Shared UI changes include an example in `src/pages/Styleguide.tsx` and accurate notes in `src/features/styleguide/catalog.ts`. Demos use local data and must not read or write a live backend.
8. **Semantic icons.** New and migrated icons use the shared Lucide icon module, inherit `currentColor`, and are sized in SCSS. Do not hand-write SVG markup in components. Library-rendered SVG, including QR codes, is allowed.
9. **Simple beats clever.** Prefer obvious code, shallow control flow, composition, and ordinary props. Do not create config-driven renderers, generic hook factories, or abstractions for imagined future needs.

## Commands and verification

- `npm run dev` — local Vite server.
- `npm run build` — strict TypeScript checks and production build.
- `npm run lint` — JavaScript/TypeScript, SCSS, and formatting gates.
- `npm run lint:js` / `npm run lint:scss` — individual linters.
- `npm run format` / `npm run format:check` — format or check maintained source and documentation.
- `npm test` — deterministic Vitest unit/component regressions.
- `npm run test:e2e` — mocked desktop/mobile Playwright regressions; never use a live backend.
- `npm run test:e2e:live` — explicit opt-in journeys against a disposable backend only. See README for required test credentials.
- `npm run review:load` — review-relevant diff against `main`, including uncommitted work.
- `npm run preview` — serve the production build.

Use Node 22.12+ and npm. Copy `.env.example` to an ignored `.env.local`; use public Supabase URL and anon key only in Vite variables. Never expose service-role keys, credentials, or Sentry upload tokens. Verification builds disable Sentry uploads. Do not deploy, apply database migrations, or run live writes as part of a frontend refactor.

Before calling work done, pass lint, relevant tests, build, and browser checks for affected journeys. Baseline at migration start: 259 passing tests and 10 existing hook-dependency warnings. Do not mechanically add effect dependencies without testing subscription, timer, and write behavior.

**Behavior-neutral changes require mechanical evidence.** For pure SCSS moves, compare compiled expanded rule sets. For markup moves, compare rendered DOM, normalizing only intentional class renames. For styling changes, use deterministic desktop/mobile screenshots and computed-style comparisons. Existing tests alone do not prove visual parity. Add meaningful regression coverage before moving untested workflows; do not add tests that only mirror implementation.

## Application boundaries

- `src/pages/` composes routes and owns page-level coordination. Nothing imports from pages.
- `src/components/ui/` contains generic UI; other component folders contain shared domain UI. Generic components earn their file by identity, even with one consumer.
- `src/features/` owns feature components, feature hooks, and feature-specific pure helpers. Parent-to-child composition is fine; sibling coordination goes through their parent.
- `src/game/hooks/` retains legacy live-read and participation hooks. Read hooks expose `{ data, loading, error, reload }`, cancel obsolete results, and refresh after Realtime changes.
- `src/lib/` owns persistence commands, backend boundaries, monitoring, and existing score/vote projections. Commands use the existing `{ data, error }` convention. Do not introduce an axios client, global toast system, or alternative auth stack.
- `src/utils/` contains genuinely generic dependency-free helpers. Do not move domain rules here just to shrink a file.
- `src/types/` contains shared contracts. Keep feature-private types in their feature. No type-only module should depend on a page component.

One named component per file. Pages orchestrate; components implement. Extract hooks by distinct external concern (queries, subscriptions, timers, media lifecycle), not arbitrary line count. Do not replace one huge component with one huge hook. Accept props through two or three levels before reaching for context. Keep symbols private unless imported.

### V2 session layers

`SessionPage` in `src/components/session/` is the common host/player shell. Its slots compose navigation, toolbar, feedback and overlays; role changes capabilities, not the common visual base. Shared challenge, submission, evidence, scores, candidate, reward, final-round and secret-review components accept presentation models and callbacks. They never read Supabase, localStorage or route parameters. Keep examples in the local session styleguide preview.

`SessionPlayerGame` adapts route parameters to `features/session-player/SessionParticipant`. The participant controller is reused inline by `HostLiveSession` after explicit host participation, with the host-specific player token and callbacks for navigation/recovery. Do not open a second player window for routine host uploads, submissions or voting. A host without a valid participation credential gets read-only shared content and an explicit join action. Host management remains separately composed and reachable during reward, final and secret-review stages.

The host route keys `features/host-live/HostSession` by session ID. That coordinator composes focused lobby, participation, roster, round/timer, reward, final, secret-review and moderation controllers. `useHostSessionData` owns the single host polling lifecycle; the timer controller owns its separate ticking/publish cadence and serialized write queue. Presentation connections remove listeners and close on identity changes or unmount. Keep these external concerns separate; do not duplicate polling in panels.

Named host and participant commands in `src/lib/*Commands.ts` use `runApi` and typed arguments. UI prompts, notices and credential storage stay in feature controllers. `useHostOperation` supplies the shared synchronous host action lock. Command feedback is separate from query feedback so a refresh cannot erase a failed operation. Preserve the original RPC payloads, filters and multi-step write ordering when extending a workflow.

Feature adapters translate database contracts into shared presentation models. Queries, timer subscriptions and participation commands stay in feature hooks/services; evidence validation and persistence live in `src/lib/sessionEvidence.ts`. Ignore obsolete query responses after navigation, identity changes or unmount. Hide winners, vote totals and voter identities while voting is open, even if a stale payload includes them. Preserve secret-review precedence over reward and ordinary game content.

ParticipantTeams projects team capacity, selected state and status copy into
shared ChoiceOption buttons. TeamNameForm supplies the controlled 40-character
name input and native form in both participant and host flows. Callers compose
their submit control and retain trimming, busy state, placeholders and commands;
the input remains editable while an operation is pending. Neither shared view
reads routes, storage or Supabase. Local team references use state only and cover
selection, creation and busy behavior through native keyboard paths. Their
styles live in the choice-option and team-name-form blocks, with shared Avatar choice,
ContentPanel/PanelHeading/Overline/CountBadge choice variants, CandidateList spaced
and Button team-create. The original compact player breakpoint is 480px. Both
form variants retain native types, callbacks and input bounds. Do not restore the
retired player team selectors or team-create-form block. Keep the pending contrast
fixes in a separate, approved accessibility slice.

PrivateMissionDialog composes the shared native Dialog with linked heading and
description IDs. Play is the only acknowledgement; Escape and backdrop dismissal
remain disabled. The participant controller owns ordering, phase visibility and
separate seen/dismissed storage keys. Phase takeover must close without marking a
mission seen; an underlying tour regains focus after acceptance. The local
private-mission example uses state only. Reveal variants of Dialog, DialogPanel,
PanelHeading, Badge, IconBadge, Overline and Button own its styling in SCSS. The
outlined heading fragment is shared by its label/title; preserve native tags,
linked IDs and explicit acceptance when composing these variants. Do not restore
the retired announcement classes in PlayerGame.css.

Join adapts URL code/entry mode and successful redirects to PlayerAccess.
usePlayerAccess owns form state, validation, feedback and V2 credential storage;
PlayerAccessView and PlayerDetailsFields are controlled presentation. Shared
GameCodeInput retains the six-digit native input contract and visible label.
The local join reference uses state only and a section root. lib/playerAccess.ts
preserves the SDK error objects because existing feedback distinguishes Error
instances from plain database errors. Its consumed response type is a frontend
contract, not verified deployed schema. AccessHeader, DisplayHeading/Note access
variants, MascotArt, FloatingNotice, FormStack, ContentPanel access-field,
FormLabel/InputIcon access and Button access/back/switch own its presentation.
GameCodeInput owns its BEM cells/control; the route shell owns arrangement. Keep
native tags, IDs, types and announcement semantics intact. The local example
includes pending and error toggles without connecting. Do not restore retired
join selectors in PlayerGame.css; the legacy import still serves the shared
spinner until its remaining consumers migrate. Pending joins use a synchronous
lock and a mounted code/mode
generation: stale success/error cannot store credentials, redirect or publish
feedback, including when the target changes away and back. The server request
may still complete. Keep name/mobile fields editable, unlock after the request
settles and allow a fresh current-target join. Keep URL hydration, entry-only mode
selection, trimmed payloads, replaced history/welcomeBack state and legacy/V2
credential isolation intact.

PlayerDemo composes features/player-demo/PlayerDemoExperience. usePlayerDemo owns
only local page/tour/sample state; controlled PlayerDemoView has no routes,
storage or backend calls. The public demo is its interactive reference. Preserve
all seven tour targets, native file chooser behavior, sample-state retention
across navigation/restarts, reload reset and zero backend/credential operations.
The older visual composition is a retained exception while the user's explicit
shared-layout choice is pending. Do not create duplicate shared session widgets
from it or treat automatic continuation as design approval; continue independent
migration work meanwhile.

Card variant="idea" composes ContentPanel's entity surface and owns its header
slot, layout, typography and hover frame in the card SCSS block. TaskCard,
LocationCard and RouteCard reuse it with controlled header/content slots.
IconButton idea-save/saved/close and Button idea-use/add/outline-toggle variants
retain native labels, titles, form types and existing pending behavior. MetadataList
and MetadataItem compose supplied copy/icons; TagList idea and Badge tag own chips.
Disclosure idea retains native practical checks; StepOutline displays caller-ordered
steps and note without route or backend access. Keep their local Shared idea card
and catalogue examples updated. Category
badges compose Badge idea variants with caller-supplied labels; their shared
SCSS preserves the existing tones and sizing without choosing domain categories.
The local Shared idea card and catalogue references exercise the same component
without connected controllers. Do not restore the retired catalogue card-frame
selectors or duplicate their surface declarations.

HostSaved composes features/host-saved/SavedItemsWorkspace. Its controller owns
collection/filter/loading and separate query/action feedback. Effect-local cleanup
rejects obsolete identity/query results, and commands check mount lifetime.
Typed hostSavedQueries/hostSavedCommands use runApi; preserve host-scoped select/
created_at ordering and the original id-only delete filter/body. The frontend
saved-item contract is not deployed schema or proof of server authorization.
Controlled SavedItemsView/SavedItemCard retain title/name/fallback precedence,
optional stops/description, zero points, incoming order and native remove labels.
The local saved-items reference uses only state, including filtering, removal and
loading and error feedback. Shared FilterGroup/Button/CountBadge filter,
PanelGrid collection, ContentPanel entity/workspace-error, IconBadge entity,
Overline workspace, Badge entity, EmptyState workspace and IconButton
entity-remove own its presentation in SCSS. SavedItemCard owns arrangement/copy
only. Preserve the 850px collection breakpoint and mobile icon dimensions.
Do not restore retired saved-item selectors or tie button appearance to a route
class; keep retained host CSS only for its remaining consumers.

Catalogue moderation/history compose ContentPanel moderation/history/item,
PanelHeading moderation, Overline/CountBadge moderation, Badge moderation-type,
PanelGrid stack, ControlRow/Button moderation and HistoryRow/StatusPill history.
The feature retains publication visibility, dates, details, sorting and callbacks;
shared views preserve caller order and never read a backend. Contribution bodies
compose DialogPanel/PanelHeading contribution, FormStack/FormLabel/FormGrid,
TagPicker/Button tag-option, Explainer and DialogActions/Button editor variants.
Keep native form types, bounds, IDs, tag limits/order and editable-while-pending
fields unchanged. TagPicker only groups caller-composed controls; feature logic
owns selection. The local catalogue and Shared review and history references use
state only. The legacy outer backdrop and decorative PlusMark remain until their
separate behavior/icon slices; visual frames do not supply modal behavior.

Catalogue presentation composes FeatureBanner/Overline banner and decorative
StickerArt, PageHeading results with ControlRow heading-actions, PanelGrid ideas,
ContentPanel workspace-error, EmptyState workspace icon/title/action slots and Note
collection-loading. CatalogueFilters composes TabList, Button collection-tab,
CountBadge tab, SearchField and FilterGroup/Button category. These shared views
accept controlled values/callbacks and own SCSS; the local catalogue reference
never mounts connected controllers. Preserve the original 1140px/850px/650px/560px
reflows and effective host typography. TabList and linked TabPanel now provide the separately tested keyboard contract
described below.
Do not restore retired catalogue shell/filter selectors in legacy stylesheets.

HostExplore's built-in records and tag choices live in features/host-explore/
catalogue.ts; feature presentation/draft types stay there, while inferred saved/
community persistence shapes live in types/hostExplore.ts. catalogueModel owns
approved-only public projection, tab categories and unsorted filtering.
challengeDraft keeps editor defaults/hydration and bounded command payloads
separate: public zero prep/performance values become absent, editor zeros remain,
and public/editor tag defaults and limits differ. Preserve those contracts and
selection order. Typed hostExploreQueries/hostExploreCommands own database reads
and writes through runApi; shared hostAuth identity, hostHubQueries admin checks
and hostSavedCommands removal retain their existing contracts. UI feedback,
trimming, timestamps, confirmation and navigation stay in the coordinator. The
favourite adapter supplies a plain record; SDK JSON serialization preserves the
stored metadata body without broad response assertions. Database exceptions use
the ordinary error result so controls can recover; this does not change auth's
SDK contract. Catalogue reads use a mount lifetime and per-collection generation:
obsolete auth/results cannot start later reads or replace a newer refresh.
Commands check the captured lifetime after auth and persistence awaits; issued
requests may finish, but obsolete outcomes cannot update UI or start reloads.
Query feedback cannot overwrite failed action feedback; a new action clears both
channels as before. These guards cover mount/refresh lifetime, not a new auth
subscription or cancellation/rollback contract. useExploreFavourites owns saved
reads/mutations; useExploreCommunity owns identity/admin recovery and community
reads/reloads; useExploreContribution owns the controlled draft and create/edit
commands; useExploreModeration owns review/delete confirmation and commands.
Each keeps its own mount lifetime and receives scoped feedback callbacks; the
route coordinates query/action precedence and navigation. Do not combine these
external concerns into one large hook or duplicate their reads in view panels.
HostExplore now adapts its route to CatalogueWorkspace, which owns local filters,
feedback/navigation and presentation adapters. CatalogueView composes controlled
filters, task/location/route cards, review rows, submission history and a supplied
contribution slot. Views accept presentation values/callbacks and never resolve
permissions, database records, persistence or route imports. Workspace retains
publication/identity filtering, dates, fallback copy and action binding. The local
catalogue reference mounts only controlled views and state, including pending,
loading, error and moderation examples; connected controllers never run there.
Catalogue tabs compose the shared horizontal TabList and linked TabPanel primitives.
Left/Right wrap; Home/End focus and activate native tab buttons through their
supplied callbacks. The caller supplies selected state, roving tabIndex and unique
IDs from useId; each tab controls a labelled panel, and inactive panels are hidden
without mounting their content. Active panels have a visible keyboard focus ring.
Keep filtering/category reset in the feature and exercise the same keyboard paths
in the backend-free local catalogue reference.
ChallengeContributionDialog composes the shared native Dialog contribution variant
and controlled frame/form slots. Escape, backdrop, Cancel and Close use one feature
callback: editing dismissal clears the edit identity/draft; unsent create drafts
remain available on reopen. useExploreContribution uses a synchronous submit lock
and dialog generation so closing before identity recovery prevents a write, and
obsolete issued-write outcomes cannot close/reset a new dialog, publish feedback,
release its lock or trigger a reload. An issued server write is not rolled back.
Only submit disables while busy; fields and dismissal remain available. Render
SessionFeedback inside the modal, with dismissal clearing both query/action
feedback. Page feedback is hidden while the dialog is open. The shared native
focus lifecycle recovers to an enabled control after disabled/removed focus and
reveals it by scrolling; preserve focus when it remains inside. Local catalogue
uses the same native dialog with local state only. PlusMark remains a decorative
text glyph for parity, not a new shared icon pattern. Do not restore retired
catalogue presentation rules or the legacy contribution backdrop.

Supabase auth is shared by the legacy and session clients. Legacy player IDs and V2 session-player credentials use different storage keys and are not interchangeable. Preserve RPC payloads, storage paths, query ordering, score semantics, subscription cleanup, timer behavior, error handling, and route/query parameters. Client storage is not an authorization boundary; policies and atomic awards require server enforcement.

`HostLogin` composes `features/host-access/HostAccess`. Its focused hook owns credentials, initial session recovery, command feedback and redirects through the typed SDK functions in `lib/hostAuth.ts`. `HostAccessForm` receives controlled values and callbacks; shared `BrandLink` and `InputIcon` remain presentation-only. The host header and login use the same host wordmark variant.

Host routes compose `features/host-workspace/HostWorkspace`, whose identity hook reads the current user and supplies sign-out/create navigation callbacks. `components/host/HostShell` is presentation-only and composes its header/navigation, account chip, content and optional sidebar/context slots. It accepts explicit identity and callbacks; use `contentAs="div"` when embedding it inside another main landmark. Its styleguide preview uses local identity/actions, including the read-only state, and never mounts the connected workspace.

Shell layout, header and navigation styling belongs to the `host-shell`, `host-header`, `host-navigation` and `mobile-navigation` SCSS blocks. Update their owned partials rather than adding overrides to a route stylesheet. `onNavigate` optionally intercepts shell links for controlled previews; omit it for normal router navigation. The local reference intercepts header/mobile links and the wordmark so exercising the preview cannot open a connected workspace.

Host controls use shared `Button` comic variants, `ButtonLink` (`to` for router links,
`href` for native anchors) and labeled `IconButton`. `Field variant="comic"`
preserves host form styling. `PageHeading` composes optional title/subtitle/action;
`WorkspaceSidebar` owns the responsive aside. Their local Host patterns examples
include disabled controls, native link handling and a toggled sidebar. Preserve
native link attributes and form button types when migrating callers.

`HostHub` adapts its route to `features/host-hub/HostDashboard`. `useHostHub`
coordinates reads and launch feedback through typed `lib/hostHubQueries.ts`
contracts; presentation-only GameCard, GameContext, GameOverview, SetupProgress
and HostDirectory accept data and callbacks. The shared checklist/context/artwork
components are also used by HostPlanSetup. Keep feature checklist rules and
navigation out of those shared components. Local Host patterns demonstrate their
primitives without mounting the connected dashboard.

`HostPlanSetup` adapts plan/import parameters to `features/host-planning/PlanEditor`.
Hydration, favourites, cover upload, saving, challenge editing and scheduling have
separate controllers. Pure plan/import models own stored-plan defaults, payload
projection and provider-specific challenge defaults; persistence stays in
`lib/hostPlanApi.ts`, with shared contracts in `types/hostPlanning.ts`. Preserve
legacy selectedTaskIds recovery and separate schedule phases. Schedule bootstrap
runs only on entry to build and preserves later edits. Feature presentation
components receive state/callbacks; connected editor hooks never run in local
styleguide demos. Planning styling belongs to owned partials under `scss/components/`, including
PlanBuilder, PlanNavigation, SelectedChallenge and TimelineItem. Shared
ContentPanel variants own the basics/builder surfaces; CountBadge, PanelHeading,
FormGrid, Explainer and ImageUpload remain presentation-only. Setup Button
variants preserve native button types and states; ImageUpload delegates file
validation/persistence to its caller. Keep their local planning examples updated.
RoundNumber supplies live-host numbering through owned SCSS; audit any retained
legacy planning selectors separately before removing them.

The six host lobby steps compose shared Avatar, ImageWell, compact StatTile,
ContentPanel/Field/Note lobby variants, StepProgress and lobby Button variants.
Their owned styles live in `scss/components/`; do not restore lobby overrides in
HostLiveGame.css. Avatar also supplies the existing account initial. Keep native
form types, file chooser contracts and roster callbacks unchanged during visual
moves. TeamChoiceCard, TeamEditor and CreateTeamForm are presentation-only;
queries and mutations stay in useHostRoster/useHostParticipation. StepProgress
accepts a data ratio and needs an adjacent visible step label. Its width is runtime
geometry, not a design value. Local lobby reference examples never mount those
connected controllers. Keep avatar/team file inputs keyboard-focusable via the
visually-hidden fragment and their label focus rings. Player choice buttons expose
full names and aria-pressed state; do not rely on avatar initials for their names.

HostManagement owns the host frame, native focus rules and reduced-motion behavior
in its SCSS partial; global host surface rules live in the global SCSS layer.
HostLiveGame.css and its three legacy frame classes are retired. Do not restore
nested HostShell, alert, avatar/team or player-header compatibility selectors.
The inherited `--lime` alias remains for existing consumers; other old palette
aliases have no consumers and were removed. Compose host controls through
ControlPanel and its ContentPanel controls surface. Button session-action,
session-secondary and session-ghost own the live pink/ghost appearances;
session-send composes the action appearance. SessionInvite uses these explicit
variants for its native button/link. Preserve round controls' distinct base,
hover and active shadows. Local reward, submission, mission and invitation
references use the same appearances and never mount connected controllers.
Host and participant tour triggers use Button session-tour; the local host-frame
example exercises its controls and tour.
GuidedTour uses the shared native-dialog lifecycle. Targets must be visible in
the current session phase; highlighting must not change their positioning. Host
tour navigation belongs to useHostTour, which closes when the session phase
changes. Shared SessionPage/titlebar target props remain presentation-only.

Host timer controls compose TimerReadout, ControlRow timer/break variants, Note
control copy and Button control/flow variants. IconButton control-replay preserves
the replay action's native label and button attributes. RoundFlowControls is the
shared presentation of backup round actions in both host panels; it receives
round/timer/reward state and callbacks, with an optional footer action. It never
owns ticking, reads or writes. The local timer reference demonstrates busy/reward
states and callbacks without backend access. Layout specific to the compact host
controls belongs to host-round-controls SCSS; timer and flow primitives own their
own blocks. Existing pause/menu text glyphs remain unchanged for visual parity
until the separate semantic-icon migration.

Host override, break-timer and upcoming-challenge editors use the shared native
Dialog host variant. Keep visible heading IDs linked with labelledBy; the
confirmation retains alertdialog semantics. dismissDisabled blocks Escape and
backdrop dismissal while an operation is pending and keeps focus inside when
its controls become disabled. useModalDialog focuses the first enabled control
rather than a Chromium-focusable scroll container. Challenge save feedback must
render inside the modal through SessionFeedback; the underlying page is inert.
Editor error dismissal uses the parent callback to clear both displayed query
and action feedback; queries still cannot erase a failed action. The local
host-dialog reference uses only local state. The editor-panel styles are owned by shared primitives in SCSS.

Host editor and confirmation bodies use DialogPanel, with native form/section
props and typed submission events. DialogActions composes explicit Button dialog
and dialog-primary variants; do not restore last-child styling in route CSS.
Badge dialog supplies the kicker. FormLabel preserves direct native label/control
markup, optional small hints, spaced editor rows and checkbox layout; FormGrid
dialog keeps numeric fields in two columns at every viewport size. DialogNotice
owns warning/error copy and optional labeled dismissal through IconButton
(dialog-dismiss). These components stay presentation-only. Their styles live in
owned SCSS partials; the small recurring dialog-copy fragment supplies paragraph
typography. Local host-dialog examples save preview state and never mount live
controllers. Preserve native types, heading IDs, validation attributes and parent
callbacks when composing these primitives.

Shared SubmissionList/SubmissionRow and EvidenceReview/EvidenceReviewItem accept
presentation values and resolved media URLs only. Host feature adapters keep
status copy, time formatting, fallback names and approval/score callbacks.
StatusPill review tones and ControlRow review actions retain those rows' native
markup; their styles live in owned SCSS partials. Keep the local submission
reference backend-free, and use the deterministic test-only WebM when verifying
native media controls. Native video captions remain an accessibility concern
for a separately tested slice, not something to suppress during styling moves.

Shared AssignmentList/AssignmentRow accept illustration, title, recipient/status
presentation and optional evidence children. Secret-mission controllers/adapters
retain status precedence, scheduling and persistence. The row composes the
IconBadge assignment variant; its native div and decorative aria-hidden boundary
are explicit. EmptyState session retains the compact inline message. Their local
assignment reference uses local data and a checkbox, never a connected controller.

MissionAssignmentForm and MissionCreationForm are controlled presentation forms.
Their callbacks accept values/events; recipient and mission choices use minimal
presentation records. Scheduling, trimming/defaults, sort order, persistence and
feedback stay in useHostSecretMissions. The forms compose FormLabel session/
session-checkbox, Disclosure session and Button session-send. Preserve native
required/min/max/length attributes, nested labels and details open behavior.
Their local reference submits only local state and demonstrates the existing
busy contract: assignment controls and submit actions disable, while creation
fields remain editable.

Final-round and secret-review management compose ContentPanel review-controls,
Overline review (native strong/span), FormGrid review, FormLabel review and StatTile
review. Keep native/comic Button review variants explicit: final controls retain
their existing comic hover/active effects; secret controls retain native effects.
The wide modifier controls grid placement only. PresentationControls owns the
TV action surface; connection lifecycle and evidence navigation remain in feature
controllers. Final evidence navigation wraps; secret navigation disables at its
boundaries. Their local reference uses only local state and never opens a device
picker or reads the backend.

HostRewardRound composes RewardSetupForm and RewardAwardControls. These controlled
feature views retain native form types, bounds, option labels and player/team
selection callbacks. useHostRewards still owns start/complete/cancel/release
commands, confirmation, action locks, feedback and reloads. Preserve edited award
points, selected winner ordering and separate player/team payload fields. Their
owned reward-setup/reward-review SCSS keeps arrangement separate from shared
fields, instructions, summaries and candidate rows.

Reward setup and awards compose FormLabel reward/award-points, ControlRow reward,
Explainer reward, IconBadge method and StatusPill reward open/completed variants.
RoundSummary receives caller-composed marker/status slots and title/detail copy;
CandidateList only groups caller-supplied candidates. These shared views never
choose a reward method, target or winner and never call persistence. Keep the
local reward reference backend-free, including disabled controls and read-only
candidates. Reward overlays compose the existing native Dialog, disable close/dismissal while
busy, and receive the coordinator's feedback slot inside the modal. Inline reward
views keep ordinary page feedback. useNavigationFocus attaches through the native
SessionNavigation elementRef and recovers focus to the active item only when a
refreshed release/cancel removed the opener and left focus on the document. It
cancels scheduled frames on unmount and never steals focus from another control.
The local session reference demonstrates this recovery without a backend.
ContentPanel overlay owns the centered/scrolled frame, PanelHeading dismissible
reserves close-action space, and Button overlay-dismiss retains the native text
close mark and states. Compose Dialog separately for modal behavior; the visual
flags do not provide focus or dismissal. Their owned SCSS and local shared-overlay
reference preserve frame, focus/hover transitions and pending-write disabled
appearance. Do not restore the retired reward-overlay compatibility rules.

StagePreview and RoundPlan receive presentation values and callbacks only.
upcomingStageModel in the host feature retains next-round availability, active-
break precedence, stage copy and illustration selection. RoundPlan composes the
detailed RoundSelector; both detailed options and existing chips use RoundChoice.
The feature owns live/read-only capability, busy state, autoplay confirmation and
round-change commands. Preserve incoming order, nullable round labels and numeric
selection payloads. The local stage/plan reference uses local selection, read-only
and break state. StagePreview, RoundSelector and RoundChoice own their SCSS.
Stage labels/illustrations and round numbers compose Badge, IconBadge and
CountBadge variants; detailed choices preserve native Button semantics. Keep
selected outlines, hover/focus and pending states when extending these views.
Host controls compose the presentation-only PanelGrid for invitation and round
overview panels. Its owned SCSS preserves the wider first column and stacks at
900px. The local host-frame reference demonstrates it without live controllers;
keep query, command and timer coordination in the caller.

Secret-review summaries and published voter rows use ReviewSummary and VoterList
with Badge vote. ContentPanel review-result owns the published result surface;
SessionLeaderboard/SessionRankRow compact retain native div/span markup. The
feature owns visibility guards, assignment filtering, missing-player names,
score/name sorting and the top-eight limit. Shared presentation preserves caller
order and never queries or chooses which results to publish. Keep their local
review-body example backend-free and on its intended dark review surface.

Voting presentation is conservative across independently refreshed sources: any
known open flag or voting status hides unpublished result details, even when a
completion/result field disagrees. Secret review keeps precedence while its
mission details are missing, rendering the shared loading state. Player vote
actions still require the explicit RPC voting-open flag; uncertain data is
read-only. Never promote a completed gallery's leaderboard while another voting
signal is active. Release results again when the open signals clear; preserve
command payloads and server-side score/award enforcement.

Local SQL migrations are not automatically applied. Legacy database contracts are inferred, and V2 RPCs have incomplete local schema coverage. Do not change backend contracts or claim live correctness based on mocked tests. Keep ordinary tests isolated from real database, auth, storage, Realtime, and Sentry endpoints.

## SCSS architecture

Use a small project-owned framework, not the other project's `scss/core`:

- `scss/variables/` — colors, fonts, spacing, type, borders, shadows, motion, and layout tokens; preserve existing values during migration.
- `scss/tools/` — recurring fragments shared across components. A one-use fragment stays inline; fragments recurring in one file use a file-local mixin.
- `scss/global/` — reset/base element styles.
- `scss/components/` — one generic BEM block per partial, direct declarations.
- `scss/routes/` — page grids, arrangement, and responsive shell behavior only.
- `scss/style.scss` — application entry, imported once by `src/main.tsx` after transitional legacy globals.

Each directory registers partials in `_index.scss`; imports use relative `@use`. Nest elements/modifiers as `&__element` and `&--modifier`. Keep media queries, including reduced-motion queries, inside the block they affect. One declaration per line; nesting depth at most six. Prefer low-specificity selectors.

**Name things by identity.** A count badge, thumbnail, titled card, or empty state is its own generic block, not an element named after the feature that first uses it. Search components, styles, and the styleguide before creating another. Remove a feature prefix when the remaining name still describes the thing. Context changes go in modifiers; placement belongs to a parent wrapper.

**Blocks own their elements.** Do not borrow another block's `__element` classes in markup. Repeated whole things become components/blocks; repeated fragments become mixins. Do not wrap whole component declaration sets in one-use mixins. Repeated raw values become shared tokens, not repeated private aliases.

The theme is Chaos Crawl's existing purple/pink/lime comic style with Quicksand and Hardbeat. V2 host/player session content intentionally shares one visual base; retain role-specific controls and current responsive breakpoints. Retheme through tokens, with explicit approval for intentional visual changes.

## Migration and reviewability

The target rules apply immediately to new and migrated code. Unmigrated `src/styles/*.css`, existing Tailwind classes, direct Lucide imports/sizes, multi-component files, and route-local Supabase work are temporary exceptions. Do not expand those patterns. Remove exceptions by subsystem after parity checks, not by mass suppression. Keep Tailwind until its final consumer is migrated; preserve cascade/import order during coexistence. Track progress and evidence in `docs/refactor-progress.md`.

Work in independently reviewable slices: guidance/regressions → styling foundation → shared UI pilot → host planning → host live → session players → remaining V2 → legacy. Separate extraction, styling conversion, and accessibility behavior fixes. Remove dead modules and update imports/catalog entries in the same slice.

When a task slice is complete, run `npm run review:load` and report its numbers. Above roughly 800 review-relevant lines, flag reviewer pressure and provide a review map: slice, purpose, mechanical changes, behavior needing scrutiny, and proof collected. The threshold is a nudge, not a hard limit. Do not hide large generated or mechanical source changes from the report.

Leave touched files better, within the purpose of the change. Report unrelated defects rather than expanding the blast radius. Comments explain constraints, reasons, or verified gotchas, not React/TypeScript idioms. Use `// @note` for a knowingly retained prototype shortcut. Never assert a rationale the repository cannot support.
