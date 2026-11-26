var e=`import SharedLeaderboard from "../../components/session/SessionLeaderboard";
import ScoreAdjustmentForm from "./ScoreAdjustmentForm";
import type { GameSession, SessionPlayer, SessionTeam } from "./types";

export default function HostSessionLeaderboard({
  session,
  players,
  teams,
  busy,
  assignTeam,
  teamById,
  adjustScore,
  scoreAdjustmentCount,
}: {
  session: GameSession;
  players: SessionPlayer[];
  teams: SessionTeam[];
  busy: boolean;
  assignTeam: (player: SessionPlayer, teamId: string) => Promise<void>;
  teamById: Map<string, SessionTeam>;
  adjustScore: (target: "player" | "team", id: string, delta: number) => void;
  scoreAdjustmentCount: number;
}) {
  const ranked = [...players].sort((a, b) =>
    session.status === "lobby"
      ? a.joined_at.localeCompare(b.joined_at)
      : b.score - a.score || a.name.localeCompare(b.name),
  );
  const teamScores = teams
    .map((team) => ({
      id: team.id,
      name: team.name,
      score: players
        .filter((player) => player.team_id === team.id)
        .reduce(
          (sum, player) => sum + player.score,
          team.manual_score_adjustment,
        ),
      detail: \`\${players.filter((player) => player.team_id === team.id).length}/\${session.team_size} players\`,
    }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return (
    <SharedLeaderboard
      variant="page"
      viewerRole="host"
      tourTarget="host-leaderboard"
      scoreControls={
        <ScoreAdjustmentForm
          players={players}
          teams={session.teams_enabled ? teams : []}
          teamsEnabled={session.teams_enabled}
          busy={busy}
          onAdjust={adjustScore}
          successCount={scoreAdjustmentCount}
        />
      }
      teamsEnabled={session.teams_enabled}
      viewerId={session.host_player_id}
      entries={ranked.map((player) => ({
        id: player.id,
        name: player.name,
        score: player.score,
        avatarUrl: player.avatar_url,
        teamId: player.team_id,
        teamName: teamById.get(player.team_id ?? "")?.name,
      }))}
      teams={session.teams_enabled ? teamScores : []}
      controls={
        session.teams_enabled &&
        session.host_chooses_teams &&
        session.status === "lobby"
          ? (entry) => {
              const player = players.find((item) => item.id === entry.id);
              return player ? (
                <select
                  aria-label={\`Team for \${player.name}\`}
                  value={player.team_id ?? ""}
                  disabled={busy}
                  onChange={(event) =>
                    void assignTeam(player, event.target.value)
                  }
                >
                  <option value="">Unassigned</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              ) : null;
            }
          : undefined
      }
    />
  );
}
`;export{e as default};