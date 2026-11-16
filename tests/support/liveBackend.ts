import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

type Backend = SupabaseClient<Database>;

/** The run UUID makes cleanup exclusive to rows created by this invocation. */
export async function withLiveBackend(
  client: Backend,
  runId: string,
  run: () => Promise<void>,
) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      runId,
    )
  ) {
    throw new Error(
      "A valid live test run UUID is required before changing backend state.",
    );
  }
  const snapshot = await client
    .from("game_state")
    .select("voting_open,show_vote_results,slideshow_open")
    .eq("id", 1)
    .single();
  if (snapshot.error || !snapshot.data) {
    throw new Error(
      `Could not snapshot disposable game state: ${snapshot.error?.message ?? "game_state row1 is missing"}`,
    );
  }
  const failures: unknown[] = [];
  try {
    const reset = await client
      .from("game_state")
      .update({
        voting_open: false,
        show_vote_results: false,
        slideshow_open: false,
      })
      .eq("id", 1);
    if (reset.error)
      throw new Error(`Could not seed test game flags: ${reset.error.message}`);
    await run();
  } catch (cause) {
    failures.push(cause);
  }
  // Attempt both cleanup operations even if the test, player deletion or flag
  // restoration fails, and retain all errors rather than hiding the original.
  try {
    const removed = await client
      .from("players")
      .delete()
      .like("name", `PW-TEST-${runId}-%`);
    if (removed.error)
      throw new Error(
        `Could not remove run-owned players: ${removed.error.message}`,
      );
  } catch (cause) {
    failures.push(cause);
  }
  try {
    const restored = await client
      .from("game_state")
      .update(snapshot.data)
      .eq("id", 1);
    if (restored.error)
      throw new Error(
        `Could not restore test game flags: ${restored.error.message}`,
      );
  } catch (cause) {
    failures.push(cause);
  }
  if (failures.length === 1) throw failures[0];
  if (failures.length)
    throw new AggregateError(
      failures,
      "Live test and/or disposable backend cleanup failed.",
    );
}
