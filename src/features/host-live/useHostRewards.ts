import type { RewardMethod, RewardTargetKind } from "../../types/hostSession";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState, type FormEvent } from "react";
import * as hostRewardCommands from "../../lib/hostRewardCommands";
import * as sessionParticipantCommands from "../../lib/sessionParticipantCommands";
import type {
  GameSession,
  SessionRewardRound as HostRewardRoundData,
  SessionChallenge,
  SessionPlayer,
  SessionRewardAward,
  SessionRewardVote,
  SessionTeam,
} from "./types";
import type { SetHostBusy } from "./useHostOperation";

interface Options {
  onReturnToGame?: () => void;
  rewardRounds: HostRewardRoundData[];
  currentChallenge: SessionChallenge | undefined;
  rewardVotes: SessionRewardVote[];
  rewardAwards: SessionRewardAward[];
  challenges: SessionChallenge[];
  session: GameSession | null;
  teams: SessionTeam[];
  players: SessionPlayer[];
  setError: Dispatch<SetStateAction<string>>;
  setBusy: SetHostBusy;
  setNotice: Dispatch<SetStateAction<string>>;
  load: () => Promise<void>;
  busy: boolean;
  ensureHostPlayerToken: (onRecovered?: () => void) => Promise<string | null>;
}
export function useHostRewards({
  onReturnToGame,
  rewardRounds,
  currentChallenge,
  rewardVotes,
  rewardAwards,
  challenges,
  session,
  teams,
  players,
  setError,
  setBusy,
  setNotice,
  load,
  busy,
  ensureHostPlayerToken,
}: Options) {
  const [rewardChallengeId, setRewardChallengeId] = useState("");
  const [rewardMethod, setRewardMethod] = useState<RewardMethod>("voting");
  const currentRoundNumber = session?.current_round_number;
  const allowedMethods = session?.reward_methods;
  useEffect(() => {
    if (currentRoundNumber === undefined) return;
    setRewardChallengeId(
      (current) =>
        current ||
        challenges.find(
          (item) =>
            item.kind === "main" &&
            item.round_number === Number(currentRoundNumber),
        )?.id ||
        challenges.find((item) => item.kind === "main")?.id ||
        challenges[0]?.id ||
        "",
    );
    const allowedRewardMethods = (allowedMethods ?? [
      "voting",
      "host_awards",
      "audience_cheers",
    ]) as RewardMethod[];
    setRewardMethod((current) =>
      allowedRewardMethods.includes(current)
        ? current
        : (allowedRewardMethods[0] ?? "host_awards"),
    );
  }, [challenges, currentRoundNumber, allowedMethods]);

  const [showRewardSetup, setShowRewardSetup] = useState(false);

  const [showRewardOverlay, setShowRewardOverlay] = useState(false);

  const [rewardTargetKind, setRewardTargetKind] =
    useState<RewardTargetKind>("player");

  const [rewardPoints, setRewardPoints] = useState(10);

  const [rewardFinalPoints, setRewardFinalPoints] = useState(10);

  const [selectedRewardWinnerIds, setSelectedRewardWinnerIds] = useState<
    string[]
  >([]);

  const activeRewardRound =
    rewardRounds.find(
      (item) =>
        item.released_at === null &&
        (item.status === "open" || item.status === "completed"),
    ) ?? null;

  const currentRoundPointsAwarded = Boolean(
    currentChallenge &&
    rewardRounds.some(
      (item) =>
        item.challenge_id === currentChallenge.id &&
        item.status === "completed" &&
        item.released_at !== null,
    ),
  );

  const activeRewardVotes = activeRewardRound
    ? rewardVotes.filter(
        (item) => item.reward_round_id === activeRewardRound.id,
      )
    : [];

  const activeRewardAwards = activeRewardRound
    ? rewardAwards.filter(
        (item) => item.reward_round_id === activeRewardRound.id,
      )
    : [];

  const activeRewardChallenge = activeRewardRound
    ? challenges.find((item) => item.id === activeRewardRound.challenge_id)
    : undefined;

  const hostRewardVote = session?.host_player_id
    ? activeRewardVotes.find(
        (vote) => vote.voter_player_id === session.host_player_id,
      )
    : undefined;

  const hostRewardVoteTargetId =
    activeRewardRound?.target_kind === "team"
      ? hostRewardVote?.target_team_id
      : hostRewardVote?.target_player_id;

  const rewardTargetRows =
    activeRewardRound?.target_kind === "team"
      ? teams.map((team) => ({
          id: team.id,
          name: team.name,
          detail: `${players.filter((player) => player.team_id === team.id).length} players`,
          score: players
            .filter((player) => player.team_id === team.id)
            .reduce((sum, player) => sum + player.score, 0),
        }))
      : players.map((player) => ({
          id: player.id,
          name: player.name,
          detail:
            teams.find((team) => team.id === player.team_id)?.name ?? "Player",
          score: player.score,
        }));

  const enabledRewardMethods = (
    session?.reward_methods ?? ["voting", "host_awards", "audience_cheers"]
  ).filter((method): method is RewardMethod =>
    ["voting", "host_awards", "audience_cheers"].includes(method),
  );

  const rewardMethodLabel = (method: RewardMethod) =>
    method === "voting"
      ? "Player voting"
      : method === "host_awards"
        ? "Host awards"
        : "Audience cheers";

  function openPointReview() {
    if (!activeRewardRound && currentChallenge) {
      setRewardChallengeId(currentChallenge.id);
      setRewardPoints(currentChallenge.points);
      setShowRewardSetup(true);
    } else {
      setShowRewardSetup(false);
    }
    setShowRewardOverlay(true);
  }

  async function startRewardRound(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !rewardChallengeId) {
      setError("Choose a challenge to reward.");
      return;
    }
    if (!enabledRewardMethods.includes(rewardMethod)) {
      setError("Choose a reward method enabled in game setup.");
      return;
    }
    if (
      rewardTargetKind === "team" &&
      (!session.teams_enabled || teams.length === 0)
    ) {
      setError("Create teams before rewarding a team.");
      return;
    }
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const { data, error: startError } =
      await hostRewardCommands.hostStartSessionRewardRound({
        p_session_id: session.id,
        p_challenge_id: rewardChallengeId,
        p_reward_method: rewardMethod,
        p_target_kind: rewardTargetKind,
        p_points: Math.max(0, Math.min(10000, Number(rewardPoints) || 0)),
      });
    setBusy(false);
    if (startError) {
      setError(startError.message);
      return;
    }
    setShowRewardSetup(false);
    setSelectedRewardWinnerIds([]);
    const method =
      (data as { reward_method?: RewardMethod } | null)?.reward_method ??
      rewardMethod;
    setNotice(
      `${rewardMethodLabel(method)} started. Players' screens have updated.`,
    );
    await load();
  }

  function toggleRewardWinner(id: string) {
    setSelectedRewardWinnerIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  async function castHostRewardVote(candidateId: string) {
    if (
      !session ||
      !activeRewardRound ||
      activeRewardRound.status !== "open" ||
      activeRewardRound.reward_method !== "voting" ||
      busy
    )
      return;
    const playerToken = await ensureHostPlayerToken();
    if (!playerToken) return;
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const { error: voteError } =
      await sessionParticipantCommands.playerCastSessionRewardVote({
        p_join_code: session.join_code,
        p_player_token: playerToken,
        p_reward_round_id: activeRewardRound.id,
        p_target_player_id:
          activeRewardRound.target_kind === "player" ? candidateId : null,
        p_target_team_id:
          activeRewardRound.target_kind === "team" ? candidateId : null,
      });
    setBusy(false);
    if (voteError) {
      setError(voteError.message);
      return;
    }
    setNotice("Your host vote has been counted.");
    await load();
  }

  async function completeRewardRound() {
    if (!activeRewardRound || busy) return;
    const manual = activeRewardRound.reward_method !== "voting";
    if (manual && selectedRewardWinnerIds.length === 0) {
      setError("Select at least one winner first.");
      return;
    }
    const manualPoints = Math.max(
      0,
      Math.min(10000, Number(rewardFinalPoints) || 0),
    );
    const confirmText =
      activeRewardRound.reward_method === "voting"
        ? `Close voting and award ${activeRewardRound.points} points to the top vote-getter${activeRewardVotes.length ? "(s)" : ""}? Tied top votes will all win.`
        : `Award ${manualPoints} points to ${selectedRewardWinnerIds.length} selected winner${selectedRewardWinnerIds.length === 1 ? "" : "s"}?`;
    if (!window.confirm(confirmText)) return;
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const { data, error: awardError } =
      await hostRewardCommands.hostCompleteSessionRewardRound({
        p_reward_round_id: activeRewardRound.id,
        p_winner_player_ids:
          activeRewardRound.target_kind === "player"
            ? selectedRewardWinnerIds
            : [],
        p_winner_team_ids:
          activeRewardRound.target_kind === "team"
            ? selectedRewardWinnerIds
            : [],
        p_points:
          activeRewardRound.reward_method === "voting" ? null : manualPoints,
      });
    setBusy(false);
    if (awardError) {
      setError(awardError.message);
      return;
    }
    const result = data as {
      winner_count?: number;
      points_awarded?: number;
    } | null;
    setNotice(
      `Reward complete. ${result?.winner_count ?? 0} winner${result?.winner_count === 1 ? "" : "s"}; ${result?.points_awarded ?? 0} points awarded. Players can see the updated leaderboard.`,
    );
    setSelectedRewardWinnerIds([]);
    await load();
  }

  async function returnFromRewardRound() {
    if (!activeRewardRound || busy) return;
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const { error: releaseError } =
      await hostRewardCommands.hostReleaseSessionRewardRound({
        p_reward_round_id: activeRewardRound.id,
      });
    setBusy(false);
    if (releaseError) {
      setError(releaseError.message);
      return;
    }
    setNotice("Everyone has been returned to the game.");
    setShowRewardOverlay(false);
    await load();
    onReturnToGame?.();
  }

  async function cancelRewardRound() {
    if (
      !activeRewardRound ||
      busy ||
      !window.confirm(
        "Cancel this reward flow and return everyone to the game without awarding points?",
      )
    )
      return;
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const { error: cancelError } =
      await hostRewardCommands.hostCancelSessionRewardRound({
        p_reward_round_id: activeRewardRound.id,
      });
    setBusy(false);
    if (cancelError) {
      setError(cancelError.message);
      return;
    }
    setNotice("Reward flow cancelled. No points were awarded.");
    setShowRewardOverlay(false);
    await load();
    onReturnToGame?.();
  }
  useEffect(() => {
    if (activeRewardRound) setRewardFinalPoints(activeRewardRound.points);
  }, [activeRewardRound?.id]);
  return {
    rewardChallengeId,
    setRewardChallengeId,
    rewardMethod,
    setRewardMethod,
    showRewardSetup,
    setShowRewardSetup,
    showRewardOverlay,
    setShowRewardOverlay,
    rewardTargetKind,
    setRewardTargetKind,
    rewardPoints,
    setRewardPoints,
    rewardFinalPoints,
    setRewardFinalPoints,
    selectedRewardWinnerIds,
    setSelectedRewardWinnerIds,
    activeRewardRound,
    currentRoundPointsAwarded,
    activeRewardVotes,
    activeRewardAwards,
    activeRewardChallenge,
    hostRewardVoteTargetId,
    rewardTargetRows,
    enabledRewardMethods,
    rewardMethodLabel,
    openPointReview,
    startRewardRound,
    toggleRewardWinner,
    castHostRewardVote,
    completeRewardRound,
    returnFromRewardRound,
    cancelRewardRound,
  };
}
