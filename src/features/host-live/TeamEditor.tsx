import Avatar from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import ImageWell from "../../components/ui/ImageWell";
import Icon from "../../components/ui/Icon";
import type { SessionPlayer, SessionTeam } from "./types";
export default function TeamEditor({
  team,
  teams,
  members,
  photoUrl,
  nameEdit,
  onNameChange,
  busy,
  renameTeam,
  uploadTeamPhoto,
  assignTeam,
}: {
  team: SessionTeam;
  teams: SessionTeam[];
  members: SessionPlayer[];
  photoUrl?: string;
  nameEdit?: string;
  onNameChange: (name: string) => void;
  busy: boolean;
  renameTeam: (team: SessionTeam) => Promise<void>;
  uploadTeamPhoto: (team: SessionTeam, file: File) => Promise<void>;
  assignTeam: (player: SessionPlayer, teamId: string) => Promise<void>;
}) {
  return (
    <article className="team-editor">
      <div className="team-editor__identity">
        <ImageWell as="span" variant="team" imageSrc={photoUrl}>
          <Icon name="users" className="icon--size-21" />
        </ImageWell>
        <input
          aria-label={`Name for ${team.name}`}
          value={nameEdit ?? team.name}
          maxLength={40}
          onChange={(event) => onNameChange(event.target.value)}
        />
        <Button
          variant="lobby-save"
          fullWidth={false}
          type="button"
          disabled={busy || !nameEdit?.trim() || nameEdit === team.name}
          onClick={() => void renameTeam(team)}
        >
          Save
        </Button>
      </div>
      <label className="team-image-upload">
        <span>
          {photoUrl ? (
            <img src={photoUrl} alt="Team photo" />
          ) : (
            <Icon name="plus" className="icon--size-20" />
          )}
        </span>
        <strong>Upload team picture</strong>
        <input
          type="file"
          aria-label={`Upload team picture for ${team.name}`}
          accept="image/*"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void uploadTeamPhoto(team, file);
            event.currentTarget.value = "";
          }}
        />
      </label>
      <div className="team-editor__members">
        {members.map((player) => (
          <label key={player.id}>
            <Avatar
              name={player.name}
              imageSrc={player.avatar_url}
              variant="compact"
            />
            <strong className="team-editor__member-name">{player.name}</strong>
            <select
              aria-label={`Team for ${player.name}`}
              value={player.team_id ?? ""}
              disabled={busy}
              onChange={(event) => void assignTeam(player, event.target.value)}
            >
              <option value="">No team</option>
              {teams.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </article>
  );
}
