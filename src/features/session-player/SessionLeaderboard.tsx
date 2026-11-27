import SharedLeaderboard from "../../components/session/SessionLeaderboard";
import type { SessionPortraits } from "../../lib/sessionPortraits";
import type { LeaderboardEntry, SessionInfo, SessionPlayerInfo } from "./types";

export default function SessionLeaderboard({
  session,
  leaderboard,
  player,
  teamLeaderboard,
  teamScoresUnavailable,
  portraits,
}: {
  session: SessionInfo;
  leaderboard: LeaderboardEntry[];
  player: SessionPlayerInfo;
  teamLeaderboard: {
    id: string;
    name: string;
    score: number;
    member_count: number;
  }[];
  teamScoresUnavailable: boolean;
  portraits: SessionPortraits;
}) {
  return (
    <SharedLeaderboard
      variant="page"
      viewerRole="player"
      title={
        session.status === "completed" ? "Final leaderboard" : "Leaderboard"
      }
      tourTarget="player-leaderboard"
      teamsEnabled={session.teams_enabled}
      teamScoresUnavailable={teamScoresUnavailable}
      viewerId={player.id}
      viewerTeamId={player.team_id}
      entries={leaderboard.map((entry) => ({
        id: entry.player_id,
        name: entry.name,
        score: entry.score,
        avatarUrl: portraits.players[entry.player_id] ?? entry.avatar_url,
        teamId: entry.team_id,
        teamName: entry.team_name,
      }))}
      teams={
        session.teams_enabled
          ? teamLeaderboard.map((team) => ({
              id: team.id,
              name: team.name,
              avatarUrl: portraits.teams[team.id],
              score: team.score,
              detail: `${team.member_count} players`,
            }))
          : []
      }
    />
  );
}
