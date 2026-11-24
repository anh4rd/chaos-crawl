import Avatar from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import TeamEditor from "./TeamEditor";
import type { SessionPlayer, SessionTeam } from "./types";

const tones = ["lime", "pink", "purple", "lavender"] as const;
const visibleAvatars = 5;

export default function RosterTeamCard({
  team,
  teams,
  members,
  teamSize,
  index,
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
  teamSize: number;
  index: number;
  photoUrl?: string;
  nameEdit?: string;
  onNameChange: (name: string) => void;
  busy: boolean;
  renameTeam: (team: SessionTeam) => Promise<void>;
  uploadTeamPhoto: (team: SessionTeam, file: File) => Promise<void>;
  assignTeam: (player: SessionPlayer, teamId: string) => Promise<void>;
}) {
  return (
    <details
      className={`roster-team roster-team--${tones[index % tones.length]}`}
    >
      <summary className="roster-team__summary">
        <span className="roster-team__copy">
          <strong className="roster-team__name">{team.name}</strong>
          <small>
            {members.length}/{teamSize} players
          </small>
        </span>
        <span className="roster-team__avatars" aria-hidden="true">
          {members.slice(0, visibleAvatars).map((player) => (
            <Avatar
              key={player.id}
              name={player.name}
              imageSrc={player.avatar_url}
              variant="compact"
            />
          ))}
        </span>
        <Icon
          name="chevron-right"
          className="roster-team__open icon--size-20"
          aria-hidden="true"
        />
      </summary>
      <div className="roster-team__body">
        {members.length === 0 ? (
          <p>No players in this team yet.</p>
        ) : (
          <ul className="roster-team__members">
            {members.map((player) => (
              <li key={player.id}>
                <Avatar
                  name={player.name}
                  imageSrc={player.avatar_url}
                  variant="compact"
                />
                <span className="roster-team__members-name">{player.name}</span>
                <select
                  aria-label={`Move ${player.name} from ${team.name}`}
                  value={team.id}
                  disabled={busy}
                  onChange={(event) =>
                    void assignTeam(player, event.target.value)
                  }
                >
                  {teams.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                  <option value="">Unassigned</option>
                </select>
                <Button
                  type="button"
                  variant="session-ghost"
                  fullWidth={false}
                  disabled={busy}
                  onClick={() => void assignTeam(player, "")}
                >
                  Remove from team
                </Button>
              </li>
            ))}
          </ul>
        )}
        <details className="roster-team__edit">
          <summary>
            <Icon name="pencil" className="icon--size-14" aria-hidden="true" />
            Edit team
          </summary>
          <TeamEditor
            team={team}
            teams={teams}
            members={[]}
            photoUrl={photoUrl}
            nameEdit={nameEdit}
            onNameChange={onNameChange}
            busy={busy}
            renameTeam={renameTeam}
            uploadTeamPhoto={uploadTeamPhoto}
            assignTeam={assignTeam}
          />
        </details>
      </div>
    </details>
  );
}
