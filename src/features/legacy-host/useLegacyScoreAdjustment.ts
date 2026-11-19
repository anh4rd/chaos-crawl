import { useEffect, useRef, useState } from "react";
import { useHostOperation } from "../host-live/useHostOperation";
import { apiError } from "../../lib/apiResult";
import { awardScore } from "../../lib/scoreApi";
import type { ScoreTarget, ScoreAction } from "./types";
export function useLegacyScoreAdjustment() {
  const { setBusy } = useHostOperation();
  const mounted = useRef(false);
  const lifetime = useRef(0);
  useEffect(() => {
    mounted.current = true;
    lifetime.current += 1;
    return () => {
      mounted.current = false;
      setBusy(false);
    };
  }, [setBusy]);
  const [scoreTarget, setScoreTarget] = useState<ScoreTarget>("player");
  const [scoreLeaderboardTarget, setScoreLeaderboardTarget] =
    useState<ScoreTarget>("player");
  const [scoreAction, setScoreAction] = useState<ScoreAction>("award");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [selectedTeamName, setSelectedTeamName] = useState("");
  const [pointsDraft, setPointsDraft] = useState("5");
  const [scoreReason, setScoreReason] = useState("");
  async function handleAwardOrDock() {
    if (!mounted.current) return;
    const points = Number(pointsDraft);
    if (!Number.isFinite(points) || points <= 0) {
      window.alert("Enter a points amount greater than zero.");
      return;
    }
    if (scoreTarget === "player" && !selectedPlayerId) {
      window.alert("Choose a player first.");
      return;
    }
    if (scoreTarget === "team" && !selectedTeamName) {
      window.alert("Choose a team first.");
      return;
    }

    if (!setBusy(true)) return;
    const generation = lifetime.current;
    const current = () => mounted.current && lifetime.current === generation;
    try {
      const challengeTitle =
        scoreReason.trim() ||
        (scoreAction === "award"
          ? "Host points award"
          : "Host points deduction");
      const { error } = await awardScore({
        playerId: scoreTarget === "player" ? selectedPlayerId : null,
        teamName: scoreTarget === "team" ? selectedTeamName : null,
        challengeType: "manual",
        challengeId: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        challengeTitle,
        points: scoreAction === "award" ? points : -points,
        reason: challengeTitle,
      });
      if (!current()) return;
      if (error) {
        window.alert(`Could not update score: ${error.message}`);
        return;
      }
      setScoreReason("");
    } catch (error) {
      if (current())
        window.alert(`Could not update score: ${apiError(error).message}`);
    } finally {
      if (current()) setBusy(false);
    }
  }
  return {
    scoreTarget,
    setScoreTarget,
    scoreLeaderboardTarget,
    setScoreLeaderboardTarget,
    scoreAction,
    setScoreAction,
    selectedPlayerId,
    setSelectedPlayerId,
    selectedTeamName,
    setSelectedTeamName,
    pointsDraft,
    setPointsDraft,
    scoreReason,
    setScoreReason,
    handleAwardOrDock,
  };
}
