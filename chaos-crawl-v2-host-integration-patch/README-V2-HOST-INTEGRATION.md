# V2 host integration patch — Chaos Crawl

This is a **patch bundle**, not a full project. It contains no `.env` files, API credentials, `node_modules`, `dist`, or `.git` history.

## Apply it

1. Make sure your terminal is inside the existing `chaos-crawl` project and on branch `v2-single-venue`.
2. Make a local commit before applying, or confirm the working tree is clean:
   ```bash
   git status
   ```
3. Extract this ZIP into the project root (`chaos-crawl/`) and allow the three existing files to be replaced. It adds two new files and updates `.gitignore`.
4. Run:
   ```bash
   npm run build
   npm run dev
   ```
5. Open `http://localhost:5173/#/admin-v2` to preview the new host screen. The legacy host remains available at `/#/admin` while you review it.

## What this first integration changes

- Adds `src/pages/AdminV2.tsx`, a four-section host UI: Live, Challenges, Scores and Players.
- Adds `src/styles/HostV2.css` for the purple/lime/pink design language and mobile bottom navigation.
- Registers `/admin-v2` and `/challenge-review` in `src/App.tsx`.
- Makes challenge review return to V2 when opened from the V2 host view.
- Changes the player game's visible current location to `Round N`, while retaining existing database grouping underneath.
- Uses the existing Supabase hooks and API functions for game state, challenges, players, completions, teams and score events.
- Uses the existing `pubs` records as round groupings so the data doesn't need to be migrated just to make the event stationary. The host sees round labels rather than venue names.
- Adds `.env` and `.env.*` to `.gitignore` while allowing `.env.example`.

## Important behaviour / known limits

- Keep the host dashboard open for scheduled auto-reveals. The browser checks the scheduled time while this screen is mounted; it is not a server-side scheduled job.
- Existing challenge descriptions live in Supabase. Update any text that says things like “bring it to the next destination” so it makes sense at one venue.
- The V2 page is an initial integration pass. It reuses the existing data layer; it does not replace all player-facing screens with the Figma redesign yet.
- The existing `ChallengeReview` page is routed now because the legacy host linked to it but `App.tsx` did not register that route.
- Score adjustment writes to `score_events`, matching the existing leaderboard's source of truth rather than directly editing `players.score`.
- This doesn't automatically rebind current components in Figma or change database schema.

## Quick test checklist

1. Open `/#/admin-v2` and confirm rounds/challenges load.
2. Open `/#/` in a second tab/device, join as a test player, and confirm the current challenge appears after the host reveals it.
3. Schedule a challenge for 1 minute in the future while leaving the host screen open. Confirm it becomes live for the player screen at the scheduled time.
4. Test award and dock points, and confirm player/team leaderboard totals update.
5. Assign a player to a team, then test review, voting and return-to-game controls.
6. Confirm `/#/admin` still opens the previous host interface.

## Environment-file warning

The source ZIP you provided contained `.env` and `.env.local`; these were **not copied into this patch**. Do not commit environment files. If `.env` is tracked by Git, adding it to `.gitignore` is not enough: remove it from tracking and rotate any secret credentials that were included. Never expose a Supabase `service_role` key in a client app.
