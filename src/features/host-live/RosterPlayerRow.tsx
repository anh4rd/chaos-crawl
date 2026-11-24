import { useState } from "react";
import Avatar from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import type { SessionPlayer, SessionTeam } from "./types";

export default function RosterPlayerRow({
  player,
  teams,
  teamsEnabled,
  isHost,
  nameEdit,
  onNameChange,
  busy,
  renamePlayer,
  assignTeam,
}: {
  player: SessionPlayer;
  teams: SessionTeam[];
  teamsEnabled: boolean;
  isHost: boolean;
  nameEdit: string | undefined;
  onNameChange: (name: string) => void;
  busy: boolean;
  renamePlayer: (player: SessionPlayer) => Promise<void>;
  assignTeam: (player: SessionPlayer, teamId: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <li className="roster-player">
      <Avatar
        name={player.name}
        imageSrc={player.avatar_url}
        variant="compact"
      />
      <span className="roster-player__name">
        {player.name}
        {isHost && <span className="roster-player__host">Host</span>}
      </span>
      {teamsEnabled && (
        <select
          className="roster-player__team"
          aria-label={`Team for ${player.name}`}
          value={player.team_id ?? ""}
          disabled={busy}
          onChange={(event) => void assignTeam(player, event.target.value)}
        >
          <option value="">Unassigned</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      )}
      <Button
        type="button"
        variant="session-edit"
        fullWidth={false}
        aria-expanded={editing}
        aria-label={`Edit ${player.name}`}
        onClick={() => setEditing((value) => !value)}
      >
        <Icon name="pencil" className="icon--size-14" aria-hidden="true" />
      </Button>
      {editing && (
        <div className="roster-player__edit">
          <label>
            Name for {player.name}
            <input
              maxLength={60}
              value={nameEdit ?? player.name}
              onChange={(event) => onNameChange(event.target.value)}
            />
          </label>
          <Button
            type="button"
            variant="control"
            fullWidth={false}
            disabled={
              busy || !nameEdit?.trim() || nameEdit.trim() === player.name
            }
            onClick={() => void renamePlayer(player)}
          >
            Save name
          </Button>
        </div>
      )}
    </li>
  );
}
