export interface Team {
  id: string | number;
  name: string;
}

export interface VoteTarget {
  voted_for_player_id: string | number | null;
  voted_for_team_id: string | number | null;
}

export interface VoteResult {
  id: string;
  name: string;
  votes: number;
}

/** Canonical IDs take precedence when a legacy name also matches an ID. */
export function normalizeTeamVoteId(
  value: string | number | null,
  teams: readonly Team[],
): string | null {
  if (value == null) return null;
  const id = String(value);
  const canonical = teams.find((team) => String(team.id) === id);
  if (canonical) return String(canonical.id);
  const matches = teams.filter((team) => team.name === id);
  return matches.length === 1 ? String(matches[0].id) : null;
}

function results(
  candidates: readonly { id: string | number; name: string }[],
  counts: Map<string, number>,
): VoteResult[] {
  return candidates
    .map((candidate) => ({
      id: String(candidate.id),
      name: candidate.name,
      votes: counts.get(String(candidate.id)) ?? 0,
    }))
    .sort((a, b) => b.votes - a.votes);
}

export function tallyPlayerVotes(
  votes: readonly VoteTarget[],
  players: readonly { id: string | number; name: string }[],
): VoteResult[] {
  const counts = new Map<string, number>();
  for (const vote of votes) {
    if (vote.voted_for_player_id == null) continue;
    const id = String(vote.voted_for_player_id);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return results(players, counts);
}

export function tallyTeamVotes(
  votes: readonly VoteTarget[],
  teams: readonly Team[],
): VoteResult[] {
  const counts = new Map<string, number>();
  for (const vote of votes) {
    const id = normalizeTeamVoteId(vote.voted_for_team_id, teams);
    if (id != null) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return results(teams, counts);
}
