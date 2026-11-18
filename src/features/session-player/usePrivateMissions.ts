import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import type {
  PlayerPage,
  PlayerRewardRound,
  SecretMission,
  SessionView,
  SharedGameTimer,
} from "./types";

interface Options {
  view: SessionView | null;
  code: string;
  activePage: PlayerPage;
  rewardRound: PlayerRewardRound | null;
  sharedTimer: SharedGameTimer | null;
  secretMissions: SecretMission[];
  setError: Dispatch<SetStateAction<string>>;
}
export function usePrivateMissions({
  view,
  code,
  activePage,
  rewardRound,
  sharedTimer,
  secretMissions,
  setError,
}: Options) {
  const [activeSecretMissionId, setActiveSecretMissionId] = useState<
    string | null
  >(null);

  const [dismissedSecretMissionKeys, setDismissedSecretMissionKeys] = useState<
    string[]
  >([]);

  const [dismissedSecretMissionCardIds, setDismissedSecretMissionCardIds] =
    useState<string[]>([]);

  useEffect(() => {
    const playerId = view?.player.id;
    if (!playerId) return;
    const storageKey = `chaos-crawl-dismissed-secret-missions:${code}:${playerId}`;
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      setDismissedSecretMissionCardIds(
        Array.isArray(parsed) ? parsed.map(String) : [],
      );
    } catch {
      setDismissedSecretMissionCardIds([]);
    }
  }, [code, view?.player.id]);

  useEffect(() => {
    const playerId = view?.player.id;
    if (
      !playerId ||
      activePage !== "game" ||
      view?.session.status !== "live" ||
      rewardRound ||
      sharedTimer?.is_on_break
    )
      return;
    const storageKey = `chaos-crawl-seen-secret-missions:${code}:${playerId}`;
    let seenIds: string[] = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      if (Array.isArray(parsed)) seenIds = parsed.map(String);
    } catch {
      /* Use in-memory dismissal if local storage is unavailable. */
    }
    const seen = new Set([
      ...seenIds,
      ...dismissedSecretMissionKeys
        .filter((key) => key.startsWith(`${storageKey}:`))
        .map((key) => key.slice(storageKey.length + 1)),
    ]);
    const unseenMission = secretMissions.find(
      (mission) => !seen.has(mission.assignment_id),
    );
    setActiveSecretMissionId(unseenMission?.assignment_id ?? null);
  }, [
    activePage,
    code,
    dismissedSecretMissionKeys,
    rewardRound,
    secretMissions,
    sharedTimer?.is_on_break,
    view?.player.id,
    view?.session.status,
  ]);

  function playSecretMission(mission: SecretMission) {
    const playerId = view?.player.id;
    if (!playerId) return;
    const storageKey = `chaos-crawl-seen-secret-missions:${code}:${playerId}`;
    const dismissalKey = `${storageKey}:${mission.assignment_id}`;
    setDismissedSecretMissionKeys((keys) =>
      keys.includes(dismissalKey) ? keys : [...keys, dismissalKey],
    );
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      const seenIds = Array.isArray(parsed) ? parsed.map(String) : [];
      localStorage.setItem(
        storageKey,
        JSON.stringify([...new Set([...seenIds, mission.assignment_id])]),
      );
    } catch {
      /* The mission remains dismissed for this visit. */
    }
    setActiveSecretMissionId(null);
  }

  function dismissCompletedSecretMission(mission: SecretMission) {
    const playerId = view?.player.id;
    if (!playerId) return;
    const storageKey = `chaos-crawl-dismissed-secret-missions:${code}:${playerId}`;
    const nextIds = [
      ...new Set([...dismissedSecretMissionCardIds, mission.assignment_id]),
    ];
    setDismissedSecretMissionCardIds(nextIds);
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextIds));
    } catch {
      setError(
        "The mission was dismissed for this visit, but the dismissal couldn't be saved on this device.",
      );
    }
    playSecretMission(mission);
  }
  return {
    activeSecretMissionId,
    dismissedSecretMissionCardIds,
    playSecretMission,
    dismissCompletedSecretMission,
  };
}
