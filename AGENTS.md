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

Feature adapters translate database contracts into shared presentation models. Queries, timer subscriptions and participation commands stay in feature hooks/services; evidence validation and persistence live in `src/lib/sessionEvidence.ts`. Ignore obsolete query responses after navigation, identity changes or unmount. Hide winners, vote totals and voter identities while voting is open, even if a stale payload includes them. Preserve secret-review precedence over reward and ordinary game content.

Supabase auth is shared by the legacy and session clients. Legacy player IDs and V2 session-player credentials use different storage keys and are not interchangeable. Preserve RPC payloads, storage paths, query ordering, score semantics, subscription cleanup, timer behavior, error handling, and route/query parameters. Client storage is not an authorization boundary; policies and atomic awards require server enforcement.

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
