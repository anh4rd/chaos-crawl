import type {
  Challenge,
  GameState,
  Player,
  Pub,
  ScoreEvent,
} from "../../types/database";
import type { LegacyHostTeam } from "../../types/legacyHost";

export interface HostRound {
  id: string;
  label: string;
  legacyName: string;
  challenges: Challenge[];
}

// Keep legacy pub identities for writes while presenting stationary-event rounds.
export function buildHostRounds(
  pubs: Pub[],
  challenges: Challenge[],
  currentPub: string | undefined,
): HostRound[] {
  const sortedPubs = [...pubs].sort(
    (a, b) =>
      Number(a.sort_order ?? a.order_index ?? 0) -
      Number(b.sort_order ?? b.order_index ?? 0),
  );
  const grouped = sortedPubs.map((pub, index) => ({
    id: String(pub.id),
    label: `Round ${index + 1}`,
    legacyName: String(pub.name ?? `Round ${index + 1}`),
    challenges: challenges
      .filter((challenge) => String(challenge.pub_id) === String(pub.id))
      .sort(
        (a, b) =>
          Number(a.reveal_order ?? 0) - Number(b.reveal_order ?? 0) ||
          Number(a.id) - Number(b.id),
      ),
  }));
  const unassigned = challenges
    .filter(
      (challenge) =>
        !challenge.pub_id ||
        !sortedPubs.some((pub) => String(pub.id) === String(challenge.pub_id)),
    )
    .sort(
      (a, b) =>
        Number(a.reveal_order ?? 0) - Number(b.reveal_order ?? 0) ||
        Number(a.id) - Number(b.id),
    );
  const nonEmpty = grouped.filter((round) => round.challenges.length > 0);
  if (unassigned.length > 0)
    nonEmpty.push({
      id: "unassigned",
      label: `Round ${nonEmpty.length + 1}`,
      legacyName: currentPub || "Stationary venue",
      challenges: unassigned,
    });
  return nonEmpty;
}

export function hostRoundState(rounds: HostRound[], game: GameState | null) {
  const orderedChallenges = rounds.flatMap((round) => round.challenges);
  const currentChallenge =
    orderedChallenges.find(
      (challenge) =>
        String(challenge.id) === String(game?.current_challenge_id),
    ) ??
    orderedChallenges.find(
      (challenge) => challenge.title === game?.current_challenge,
    ) ??
    null;
  const currentChallengeIndex = currentChallenge
    ? orderedChallenges.findIndex(
        (challenge) => String(challenge.id) === String(currentChallenge.id),
      )
    : -1;
  const nextChallenge =
    orderedChallenges[
      currentChallengeIndex >= 0 ? currentChallengeIndex + 1 : 0
    ] ?? null;
  const scheduledChallenge =
    orderedChallenges.find(
      (challenge) =>
        String(challenge.id) === String(game?.scheduled_challenge_id),
    ) ?? null;
  const currentRound =
    rounds.find((round) =>
      round.challenges.some(
        (challenge) => String(challenge.id) === String(currentChallenge?.id),
      ),
    ) ?? null;
  const challengeProgress =
    orderedChallenges.length > 0
      ? Math.max(
          0,
          Math.min(
            100,
            ((currentChallengeIndex + 1) / orderedChallenges.length) * 100,
          ),
        )
      : 0;
  const scheduledTime = game?.scheduled_reveal_at
    ? new Date(game.scheduled_reveal_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  return {
    orderedChallenges,
    currentChallenge,
    currentChallengeIndex,
    nextChallenge,
    scheduledChallenge,
    currentRound,
    challengeProgress,
    scheduledTime,
  };
}

export function hostTeamNames(
  teams: LegacyHostTeam[],
  players: Player[],
  scoreEvents: ScoreEvent[],
) {
  return Array.from(
    new Set([
      ...teams.map((team) => team.name),
      ...players
        .map((player) => player.team)
        .filter((team): team is string => Boolean(team)),
      ...scoreEvents
        .map((event) => event.team_name)
        .filter((team): team is string => Boolean(team)),
    ]),
  ).sort((a, b) => a.localeCompare(b));
}
export function hostTeamLeaderboard(
  names: string[],
  teams: Array<{ name: string; score: number; avatarUrl?: string | null }>,
) {
  return names
    .map((name) => ({
      id: name,
      name,
      score: teams.find((team) => team.name === name)?.score ?? 0,
      avatarUrl: teams.find((team) => team.name === name)?.avatarUrl,
    }))
    .sort((a, b) => b.score - a.score);
}
