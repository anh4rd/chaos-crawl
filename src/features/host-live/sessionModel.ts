import type {
  GameSession,
  SessionChallenge,
  SessionEvidence,
  SessionFinalRoundChallenge,
  SessionFinalRoundState,
  SessionFinalVote,
  SessionPlayer,
  SessionSubmission,
  SessionTeam,
} from "./types";

interface Options {
  challenges: SessionChallenge[];
  session: GameSession | null;
  teams: SessionTeam[];
  players: SessionPlayer[];
  submissions: SessionSubmission[];
  evidence: SessionEvidence[];
  finalRoundState: SessionFinalRoundState | null;
  finalRoundChallenges: SessionFinalRoundChallenge[];
  finalVotes: SessionFinalVote[];
}
export function buildHostSessionModel({
  challenges,
  session,
  teams,
  players,
  submissions,
  evidence,
  finalRoundState,
  finalRoundChallenges,
  finalVotes,
}: Options) {
  const mainRounds = challenges
    .filter((item) => item.kind === "main" && item.round_number !== null)
    .sort((a, b) => Number(a.round_number) - Number(b.round_number));

  const sideChallenges = challenges.filter((item) => item.kind === "side");

  const secretChallenges = challenges.filter((item) => item.kind === "secret");

  const currentChallenge = mainRounds.find(
    (item) => item.round_number === session?.current_round_number,
  );

  const readyTeamsCount = teams.filter((team) =>
    players.some((player) => player.team_id === team.id),
  ).length;

  const unassignedPlayers = players.filter((player) => !player.team_id);

  const playerById = new Map(players.map((player) => [player.id, player]));

  const hostPlayer = session?.host_player_id
    ? playerById.get(session.host_player_id)
    : undefined;

  const rankedPlayers = [...players].sort(
    (a, b) => b.score - a.score || a.name.localeCompare(b.name),
  );

  const headerPlayer = hostPlayer ?? rankedPlayers[0];

  const headerRank = headerPlayer
    ? rankedPlayers.findIndex((player) => player.id === headerPlayer.id) + 1
    : null;

  const challengeById = new Map(
    challenges.map((challenge) => [challenge.id, challenge]),
  );

  const sideSubmissions = submissions.filter(
    (item) => challengeById.get(item.challenge_id)?.kind === "side",
  );

  const teamById = new Map(teams.map((team) => [team.id, team]));

  const finalSideEvidence = evidence
    .filter((item) => {
      if (
        item.secret_assignment_id ||
        challengeById.get(item.challenge_id)?.kind !== "side"
      )
        return false;
      return submissions.some(
        (submission) =>
          submission.player_id === item.player_id &&
          submission.challenge_id === item.challenge_id &&
          (submission.status === "submitted" ||
            submission.status === "approved"),
      );
    })
    .sort(
      (a, b) =>
        a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
    );

  const selectedFinalChallengeId =
    finalRoundState?.slideshow_challenge_id ?? sideChallenges[0]?.id ?? "";

  const selectedFinalChallengeState = finalRoundChallenges.find(
    (item) => item.challenge_id === selectedFinalChallengeId,
  );

  const finalVotingOpen = Boolean(
    session?.final_voting_open ||
    finalRoundState?.voting_open ||
    selectedFinalChallengeState?.status === "voting",
  );
  const selectedFinalChallengeStatus = finalVotingOpen
    ? "voting"
    : (selectedFinalChallengeState?.status ?? "pending");

  const selectedFinalChallenge = challengeById.get(selectedFinalChallengeId);

  const selectedFinalChallengeEvidence = finalSideEvidence.filter(
    (item) => item.challenge_id === selectedFinalChallengeId,
  );

  const selectedFinalEvidenceIndex = Math.max(
    0,
    selectedFinalChallengeEvidence.findIndex(
      (item) => item.id === finalRoundState?.slideshow_evidence_id,
    ),
  );

  const selectedFinalEvidence =
    selectedFinalChallengeEvidence[selectedFinalEvidenceIndex] ??
    selectedFinalChallengeEvidence[0] ??
    null;

  const selectedFinalChallengeVotes = finalVotes.filter(
    (item) => item.challenge_id === selectedFinalChallengeId,
  );

  const finalVoteCountByEvidence = new Map<string, number>();

  for (const vote of selectedFinalChallengeVotes) {
    finalVoteCountByEvidence.set(
      vote.evidence_id,
      (finalVoteCountByEvidence.get(vote.evidence_id) ?? 0) + 1,
    );
  }

  const finalTopVoteCount = Math.max(0, ...finalVoteCountByEvidence.values());

  const finalWinningEvidenceIds = new Set(
    [...finalVoteCountByEvidence.entries()]
      .filter(
        ([, voteCount]) =>
          finalTopVoteCount > 0 && voteCount === finalTopVoteCount,
      )
      .map(([evidenceId]) => evidenceId),
  );

  const currentFinalSortOrder =
    selectedFinalChallenge?.sort_order ?? Number.NEGATIVE_INFINITY;

  const pendingFinalChallengesInOrder = sideChallenges
    .filter((challenge) =>
      finalRoundChallenges.some(
        (state) =>
          state.challenge_id === challenge.id && state.status === "pending",
      ),
    )
    .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));

  const nextPendingFinalChallenge =
    pendingFinalChallengesInOrder.find(
      (challenge) =>
        challenge.id !== selectedFinalChallengeId &&
        challenge.sort_order > currentFinalSortOrder,
    ) ??
    pendingFinalChallengesInOrder.find(
      (challenge) => challenge.id !== selectedFinalChallengeId,
    );

  const reviewedFinalChallengesInOrder = sideChallenges
    .filter(
      (challenge) =>
        challenge.id !== selectedFinalChallengeId &&
        finalRoundChallenges.some(
          (state) =>
            state.challenge_id === challenge.id && state.status === "results",
        ),
    )
    .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));

  const nextReviewedFinalChallenge =
    reviewedFinalChallengesInOrder.find(
      (challenge) => challenge.sort_order > currentFinalSortOrder,
    ) ?? reviewedFinalChallengesInOrder[0];
  return {
    mainRounds,
    sideChallenges,
    secretChallenges,
    currentChallenge,
    readyTeamsCount,
    unassignedPlayers,
    playerById,
    hostPlayer,
    rankedPlayers,
    headerPlayer,
    headerRank,
    challengeById,
    sideSubmissions,
    teamById,
    finalSideEvidence,
    selectedFinalChallengeId,
    selectedFinalChallengeState,
    selectedFinalChallengeStatus,
    selectedFinalChallenge,
    selectedFinalChallengeEvidence,
    selectedFinalEvidenceIndex,
    selectedFinalEvidence,
    selectedFinalChallengeVotes,
    finalTopVoteCount,
    finalWinningEvidenceIds,
    nextPendingFinalChallenge,
    nextReviewedFinalChallenge,
  };
}
