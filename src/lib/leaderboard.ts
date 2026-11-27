import type { Player, ScoreEvent } from "../types/database";

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  events: ScoreEvent[];
  avatarUrl?: string | null;
}

/** Personal awards count for their player and that player's current team.
 * Direct team awards count once for the team and never for individual players.
 */
export function buildLeaderboards(
  players: readonly Player[],
  events: readonly ScoreEvent[],
  teamRecords: readonly { name: string; avatar_url?: string | null }[] = [],
) {
  const personal = new Map(
    players.map((player): [string, LeaderboardEntry] => [
      player.id,
      {
        id: player.id,
        name: player.name,
        score: 0,
        events: [],
        ...(player.avatar_url ? { avatarUrl: player.avatar_url } : {}),
      },
    ]),
  );
  const membership = new Map(players.map((player) => [player.id, player.team]));
  const teams = new Map<string, LeaderboardEntry>();
  function teamEntry(name: string) {
    const existing = teams.get(name);
    if (existing) return existing;
    const avatarUrl = teamRecords.find(
      (team) => team.name === name,
    )?.avatar_url;
    const entry: LeaderboardEntry = {
      id: name,
      name,
      score: 0,
      events: [],
      ...(avatarUrl ? { avatarUrl } : {}),
    };
    teams.set(name, entry);
    return entry;
  }
  for (const player of players) if (player.team?.trim()) teamEntry(player.team);
  for (const event of events) {
    const points = Number(event.points);
    if (!Number.isFinite(points)) continue;
    const team =
      event.team_name ||
      (event.player_id ? membership.get(event.player_id) : null);
    if (event.player_id && !event.team_name) {
      const entry = personal.get(event.player_id);
      if (entry) {
        entry.score += points;
        entry.events.push(event);
      }
    }
    if (team?.trim()) {
      const entry = teamEntry(team);
      entry.score += points;
      entry.events.push(event);
    }
  }
  const sort = (entries: Iterable<LeaderboardEntry>) =>
    [...entries].sort(
      (a, b) => b.score - a.score || a.name.localeCompare(b.name),
    );
  return { players: sort(personal.values()), teams: sort(teams.values()) };
}
