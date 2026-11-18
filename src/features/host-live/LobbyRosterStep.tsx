import StatTile from "../../components/ui/StatTile";
import Note from "../../components/ui/Note";
import { Field } from "../../components/ui/Field";
import Avatar from "../../components/ui/Avatar";
import ContentPanel from "../../components/ui/ContentPanel";
import type { GameSession, SessionPlayer, SessionTeam } from "./types";

interface Props {
  players: SessionPlayer[];
  session: GameSession;
  teams: SessionTeam[];
  hostPlayer: SessionPlayer | undefined;
  teamById: Map<string, SessionTeam>;
  busy: boolean;
  updatePlayersPerTeam: (size: number) => Promise<void>;
}
export default function LobbyRosterStep({
  players,
  session,
  teams,
  hostPlayer,
  teamById,
  busy,
  updatePlayersPerTeam,
}: Props) {
  return (
    <ContentPanel
      data-tour="host-lobby-roster"
      as="div"
      variant="lobby"
      className="lobby-roster"
    >
      <div className="metric-grid">
        <StatTile
          variant="compact"
          value={players.length}
          label="Players joined"
        />
        <StatTile
          variant="compact"
          value={session.teams_enabled ? teams.length : 0}
          label="Teams ready"
        />
      </div>
      <div className="player-roster">
        {players.length ? (
          players.map((player) => (
            <div className="player-roster__row" key={player.id}>
              <Avatar
                name={player.name}
                imageSrc={player.avatar_url}
                variant="roster"
              />
              <strong>
                {player.name}
                {player.id === hostPlayer?.id ? " (You)" : ""}
              </strong>
              <span>
                {session.teams_enabled
                  ? (teamById.get(player.team_id ?? "")?.name ??
                    "Not in a team")
                  : "Ready"}
              </span>
            </div>
          ))
        ) : (
          <Note variant="lobby">
            Players will appear here as they join using your code or link.
          </Note>
        )}
      </div>
      {session.teams_enabled ? (
        <Field variant="lobby" label="Players per team">
          <select
            value={session.team_size}
            disabled={busy}
            onChange={(event) =>
              void updatePlayersPerTeam(Number(event.target.value))
            }
          >
            {[...new Set([session.team_size, 2, 3, 4, 5, 6, 8, 10, 12])]
              .sort((a, b) => a - b)
              .map((size) => (
                <option key={size} value={size}>
                  {size} players
                </option>
              ))}
          </select>
        </Field>
      ) : (
        <Note variant="lobby">This game is set up for individual players.</Note>
      )}
    </ContentPanel>
  );
}
