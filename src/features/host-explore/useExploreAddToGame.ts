import { useEffect, useRef, useState } from "react";
import {
  readExploreGamePlan,
  readExploreActiveSessions,
  readExploreGames,
  type ExploreGame,
} from "../../lib/hostExploreQueries";
import { updateExploreGamePlan } from "../../lib/hostExploreCommands";
import { readApprovedPlanTask } from "../../lib/hostPlanApi";
import { failedResult } from "../../lib/apiResult";
import {
  communityPlanTask,
  explorePlanTask,
} from "../host-planning/planImports";
import type { Task } from "../host-planning/types";
import { addChallengeToPlan } from "./addChallengeToPlan";
import type { CatalogTask } from "./types";

type Choice = { task: CatalogTask; kind: CatalogTask["kind"] };
export function useExploreAddToGame({
  navigate,
}: {
  navigate: (url: string) => void;
}) {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [games, setGames] = useState<ExploreGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const scope = useRef(0);
  const lock = useRef(false);
  const current = useRef<Choice | null>(null);
  useEffect(
    () => () => {
      scope.current += 1;
    },
    [],
  );

  async function save(game: ExploreGame, selected: Choice, generation: number) {
    setSaving(true);
    setError("");
    try {
      const { data: row, error: readError } = await readExploreGamePlan(
        game.id,
      ).catch(failedResult);
      if (scope.current !== generation) return;
      if (readError || !row)
        throw new Error(
          readError?.message ?? "This game is no longer available.",
        );
      if (row.status !== "draft" && row.status !== "planned")
        throw new Error(
          "This game is no longer an editable draft or planned game.",
        );
      const { data: sessions, error: sessionError } =
        await readExploreActiveSessions(game.id).catch(failedResult);
      if (scope.current !== generation) return;
      if (sessionError || !sessions)
        throw new Error(
          sessionError?.message ?? "Couldn't check this game's sessions.",
        );
      if (sessions.length)
        throw new Error(
          "This game already has an active session, so its plan cannot be changed here.",
        );
      let task: Task;
      if (selected.task.id.startsWith("community-")) {
        const { data, error: communityError } = await readApprovedPlanTask(
          selected.task.id.slice("community-".length),
        ).catch(failedResult);
        if (scope.current !== generation) return;
        if (communityError || !data)
          throw new Error(
            communityError?.message ??
              "This community challenge is no longer available.",
          );
        task = communityPlanTask(data, selected.kind);
      } else {
        task = explorePlanTask(JSON.stringify(selected.task), selected.kind);
      }
      const result = addChallengeToPlan(row.plan_data, task);
      if (result.added) {
        const { data, error: writeError } = await updateExploreGamePlan({
          id: game.id,
          status: row.status,
          updatedAt: row.updated_at,
          plan: result.plan,
        }).catch(failedResult);
        if (scope.current !== generation) return;
        if (writeError || !data)
          throw new Error(
            writeError?.message ??
              "The game changed or is no longer available. Retry to reload it.",
          );
      }
      setChoice(null);
      current.current = null;
      setNotice(
        result.added
          ? `Added “${task.title}” to ${game.name} as ${selected.kind}.`
          : `“${task.title}” is already in ${game.name} as ${selected.kind}.`,
      );
    } catch (reason) {
      if (scope.current === generation)
        setError(
          reason instanceof Error
            ? reason.message
            : "Couldn't add the challenge.",
        );
    } finally {
      if (scope.current === generation) {
        lock.current = false;
        setSaving(false);
      }
    }
  }

  async function load(selected: Choice, generation: number) {
    setLoading(true);
    setError("");
    const { data, error: readError } =
      await readExploreGames().catch(failedResult);
    if (scope.current !== generation) return;
    setLoading(false);
    if (readError || !data) {
      setError(readError?.message ?? "Couldn't load your games.");
      lock.current = false;
      return;
    }
    const available = data.filter(
      (game) => game.status === "draft" || game.status === "planned",
    );
    setGames(available);
    if (available.length === 1) await save(available[0], selected, generation);
    else lock.current = false;
  }
  function start(task: CatalogTask, kind: CatalogTask["kind"]) {
    if (lock.current) return;
    lock.current = true;
    const selected = { task, kind };
    current.current = selected;
    setChoice(selected);
    setGames([]);
    setNotice("");
    const generation = ++scope.current;
    void load(selected, generation);
  }
  function close() {
    if (lock.current && saving) return;
    scope.current += 1;
    lock.current = false;
    current.current = null;
    setChoice(null);
    setLoading(false);
  }
  function retry() {
    if (!current.current || lock.current) return;
    lock.current = true;
    void load(current.current, ++scope.current);
  }
  function choose(game: ExploreGame) {
    if (!current.current || lock.current) return;
    lock.current = true;
    void save(game, current.current, scope.current);
  }
  function create() {
    if (!current.current) return;
    const { task, kind } = current.current;
    const parameter = task.id.startsWith("community-")
      ? `communityTask=${encodeURIComponent(task.id.slice("community-".length))}`
      : `exploreTask=${encodeURIComponent(JSON.stringify(task))}`;
    close();
    navigate(`/host/games/new?${parameter}&challengeKind=${kind}`);
  }
  return {
    choice,
    games,
    loading,
    saving,
    error,
    notice,
    setNotice,
    start,
    close,
    choose,
    retry,
    create,
  };
}
