import SharedLeaderboard from "../../components/session/SessionLeaderboard";
import type { LeaderboardEntry, SessionInfo, SessionPlayerInfo } from "./types";

export default function SessionLeaderboard({
  session,
  leaderboard,
  player,
  teamLeaderboard,
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
}) {
  return (
    <SharedLeaderboard
      title={
        session.status === "completed" ? "Final leaderboard" : "Leaderboard"
      }
      tourTarget="player-leaderboard"
      teamsEnabled={session.teams_enabled}
      viewerId={player.id}
      viewerTeamId={player.team_id}
      entries={leaderboard.map((entry) => ({
        id: entry.player_id,
        name: entry.name,
        score: entry.score,
        avatarUrl: entry.avatar_url,
        teamId: entry.team_id,
        teamName: entry.team_name,
      }))}
      teams={
        session.teams_enabled
          ? teamLeaderboard.map((team) => ({
              id: team.id,
              name: team.name,
              score: team.score,
              detail: `${team.member_count} players`,
            }))
          : []
      }
    />
  );
}
