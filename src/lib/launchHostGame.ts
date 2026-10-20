import { supabase } from "./supabase";
import { updateGameState } from "./gameApi";

interface PlannedTask {
  id?: string;
  title: string;
  description?: string | null;
  points?: number;
  minutes?: number;
  kind?: "main" | "side" | "secret" | string;
  tags?: string[];
}

interface LaunchResult {
  alreadyLive: boolean;
  roundCount: number;
  sideChallengeCount: number;
  statusWarning?: string;
}

function asMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error ?? "Unknown error");
}

function isMissingOrderIndex(error: unknown): boolean {
  const message = asMessage(error).toLowerCase();
  return message.includes("order_index") && (
    message.includes("column") ||
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("could not find")
  );
}

/**
 * Loads a saved plan into the existing single-active-game runtime used by
 * /admin, /game and the live challenge hooks.
 *
 * The current runtime uses global legacy tables. This function deliberately
 * adds new rounds/challenges without deleting old round/player/result rows.
 */
export async function launchHostGamePlan(hostGameId: string): Promise<LaunchResult> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData.user;
  if (authError || !user) {
    throw new Error("Your host session has expired. Log in again before launching a game.");
  }

  const { data: savedPlan, error: planError } = await supabase
    .from("host_games")
    .select("id, host_id, name, status, venue_name, plan_data")
    .eq("id", hostGameId)
    .eq("host_id", user.id)
    .single();

  if (planError || !savedPlan) {
    throw new Error(`Couldn't load this saved plan: ${planError?.message ?? "plan not found"}`);
  }

  if (savedPlan.status === "live") {
    return { alreadyLive: true, roundCount: 0, sideChallengeCount: 0 };
  }
  if (savedPlan.status !== "planned") {
    throw new Error("Only a planned game can be launched. Open the plan and save it as Planned first.");
  }

  const planData = (savedPlan.plan_data && typeof savedPlan.plan_data === "object"
    ? savedPlan.plan_data
    : {}) as Record<string, unknown>;

  const chosenTasks = Array.isArray(planData.selectedTasks)
    ? (planData.selectedTasks as PlannedTask[])
    : [];

  if (!chosenTasks.length) {
    throw new Error("This plan has no saved challenge details. Open the plan, choose your challenges and save it again.");
  }

  const mainTasks = chosenTasks.filter((task) =>
    (task.kind ?? "main") === "main" && Boolean(task.title?.trim())
  );

  const includeSide = planData.sideChallenges !== false;
  const includeSecret = Boolean(planData.secretMissions || planData.sabotage);
  const secretTasks = chosenTasks.filter((task) =>
    task.kind === "secret" && includeSecret && Boolean(task.title?.trim())
  );
  if (secretTasks.length) {
    throw new Error(
      "This plan includes secret missions or sabotage. The current live game makes active side challenges visible to everyone, so these cannot be launched privately yet. Edit the plan and turn off Secret missions and Sabotage before playing."
    );
  }

  const sideTasks = chosenTasks.filter((task) =>
    task.kind === "side" && includeSide && Boolean(task.title?.trim())
  );

  if (!mainTasks.length) {
    throw new Error("Add at least one main challenge to the plan before playing.");
  }

  // The legacy player view expects a pub record per round. Here each main
  // challenge is its own round, but all rounds stay at the plan's one venue.
  const { data: existingPubs, error: pubsLoadError } = await supabase
    .from("pubs")
    .select("*")
    .order("sort_order", { ascending: true });

  if (pubsLoadError) {
    throw new Error(`Couldn't prepare the rounds: ${pubsLoadError.message}`);
  }

  const currentPubs = (existingPubs ?? []) as Array<Record<string, unknown>>;
  const nextSortOrder = Math.max(0, ...currentPubs.map((pub) => Number(pub.sort_order ?? 0))) + 1;
  const nextOrderIndex = Math.max(0, ...currentPubs.map((pub) => Number(pub.order_index ?? 0))) + 1;
  const knownNames = new Set(currentPubs.map((pub) => String(pub.name ?? "")));
  const launchStamp = `${hostGameId.slice(0, 4)}-${Date.now().toString(36).slice(-4)}`;

  const createdPubs: Array<{ id: string | number; name: string }> = [];
  const createdChallenges: Array<{ id: string | number; title: string; description: string; reveal_order: number }> = [];
  const createdSideChallengeIds: Array<string | number> = [];
  let previousActiveSideIds: Array<string | number> = [];
  let previousSideChallengesDisabled = false;
  let runtimeStarted = false;

  const rollbackBeforeLaunch = async () => {
    if (createdSideChallengeIds.length) {
      await supabase.from("side_challenges").delete().in("id", createdSideChallengeIds);
    }
    if (previousSideChallengesDisabled && previousActiveSideIds.length) {
      await supabase.from("side_challenges").update({ active: true }).in("id", previousActiveSideIds);
    }
    if (createdChallenges.length) {
      await supabase.from("challenges").delete().in("id", createdChallenges.map((item) => item.id));
    }
    if (createdPubs.length) {
      await supabase.from("pubs").delete().in("id", createdPubs.map((item) => item.id));
    }
  };

  try {
    // Generate unique round names because older tests may already have "Round 1".
    for (let index = 0; index < mainTasks.length; index += 1) {
      const simpleName = `Round ${index + 1}`;
      let roundName = knownNames.has(simpleName) ? `${simpleName} · ${launchStamp}` : simpleName;
      let suffix = 2;
      while (knownNames.has(roundName)) {
        roundName = `${simpleName} · ${launchStamp}-${suffix}`;
        suffix += 1;
      }
      knownNames.add(roundName);

      const baseRow: Record<string, unknown> = {
        name: roundName,
        sort_order: nextSortOrder + index,
        order_index: nextOrderIndex + index,
      };

      let { data: pub, error: pubInsertError } = await supabase
        .from("pubs")
        .insert(baseRow)
        .select("id, name")
        .single();

      // Some versions of the legacy schema use sort_order without order_index.
      if (pubInsertError && isMissingOrderIndex(pubInsertError)) {
        const fallbackRow = {
          name: roundName,
          sort_order: nextSortOrder + index,
        };
        const retry = await supabase
          .from("pubs")
          .insert(fallbackRow)
          .select("id, name")
          .single();
        pub = retry.data;
        pubInsertError = retry.error;
      }

      if (pubInsertError || !pub) {
        throw new Error(`Couldn't create round ${index + 1}: ${pubInsertError?.message ?? "no round returned"}`);
      }
      createdPubs.push({ id: pub.id as string | number, name: String(pub.name) });
    }

    for (let index = 0; index < mainTasks.length; index += 1) {
      const task = mainTasks[index];
      const round = createdPubs[index];
      const title = task.title.trim();
      const tags = Array.isArray(task.tags) ? task.tags.map(String) : [];
      const allowPhotoUpload = Boolean(planData.evidenceRequired) || tags.some((tag) => /photo|video|evidence/i.test(tag));

      const { data: challenge, error: challengeInsertError } = await supabase
        .from("challenges")
        .insert({
          pub_id: round.id,
          title,
          description: String(task.description ?? ""),
          points: Math.max(0, Number(task.points ?? 10)),
          reveal_order: index + 1,
          allow_photo_upload: allowPhotoUpload,
        })
        .select("id, title, description, reveal_order")
        .single();

      if (challengeInsertError || !challenge) {
        throw new Error(`Couldn't add "${title}" to the live game: ${challengeInsertError?.message ?? "no challenge returned"}`);
      }
      createdChallenges.push({
        id: challenge.id as string | number,
        title: String(challenge.title),
        description: String(challenge.description ?? ""),
        reveal_order: Number(challenge.reveal_order ?? index + 1),
      });
    }

    // Replace only the active side-challenge list, not its history.
    const { data: previousSide, error: sideLoadError } = await supabase
      .from("side_challenges")
      .select("id")
      .eq("active", true);

    if (sideLoadError) {
      throw new Error(`Couldn't prepare side challenges: ${sideLoadError.message}`);
    }
    previousActiveSideIds = (previousSide ?? []).map((row: { id: string | number }) => row.id);

    if (previousActiveSideIds.length) {
      const { error: disableError } = await supabase
        .from("side_challenges")
        .update({ active: false })
        .in("id", previousActiveSideIds);
      if (disableError) {
        throw new Error(`Couldn't switch the active side challenges: ${disableError.message}`);
      }
      previousSideChallengesDisabled = true;
    }

    if (sideTasks.length) {
      const { data: insertedSide, error: sideInsertError } = await supabase
        .from("side_challenges")
        .insert(sideTasks.map((task) => ({
          title: task.title.trim(),
          description: String(task.description ?? ""),
          points: Math.max(0, Number(task.points ?? 10)),
          active: true,
        })))
        .select("id");

      if (sideInsertError) {
        throw new Error(`Couldn't add the selected side challenges: ${sideInsertError.message}`);
      }
      createdSideChallengeIds.push(...(insertedSide ?? []).map((row: { id: string | number }) => row.id));
    }

    const firstChallenge = createdChallenges[0];
    const { error: stateError } = await updateGameState({
      current_pub: createdPubs[0].name,
      current_challenge_id: Number(firstChallenge.id),
      current_challenge: firstChallenge.title,
      challenge_description: firstChallenge.description,
      current_challenge_order: firstChallenge.reveal_order,
      voting_open: false,
      voting_target: planData.teamsEnabled === false ? "player" : "team",
      show_vote_results: false,
      slideshow_open: false,
      scheduled_challenge_id: null,
      scheduled_reveal_at: null,
    });

    if (stateError) {
      throw new Error(`The rounds were prepared, but the live game couldn't be updated: ${stateError.message}`);
    }
    runtimeStarted = true;

    const updatedPlanData = {
      ...planData,
      runtimeLaunch: {
        launchedAt: new Date().toISOString(),
        venueName: String(savedPlan.venue_name ?? ""),
        roundPubIds: createdPubs.map((item) => item.id),
        challengeIds: createdChallenges.map((item) => item.id),
        sideChallengeIds: createdSideChallengeIds,
      },
    };

    const { error: statusError } = await supabase
      .from("host_games")
      .update({ status: "live", plan_data: updatedPlanData })
      .eq("id", hostGameId)
      .eq("host_id", user.id);

    return {
      alreadyLive: false,
      roundCount: createdPubs.length,
      sideChallengeCount: createdSideChallengeIds.length,
      ...(statusError ? { statusWarning: statusError.message } : {}),
    };
  } catch (error) {
    if (!runtimeStarted) {
      await rollbackBeforeLaunch();
    }
    throw new Error(asMessage(error));
  }
}
