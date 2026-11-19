import Avatar from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import ImageWell from "../../components/ui/ImageWell";
import Icon from "../../components/ui/Icon";
import type { SessionPlayer, SessionTeam } from "./types";
export default function TeamChoiceCard({
  team,
  members,
  selectedPlayer,
  selectedLobbyPlayerId,
  teamSize,
  photoUrl,
  busy,
  onSelectPlayer,
  assignTeam,
}: {
  team: SessionTeam;
  members: SessionPlayer[];
  selectedPlayer?: SessionPlayer;
  selectedLobbyPlayerId: string;
  teamSize: number;
  photoUrl?: string;
  busy: boolean;
  onSelectPlayer: (id: string) => void;
  assignTeam: (player: SessionPlayer, teamId: string) => Promise<void>;
}) {
  const isMember = selectedPlayer?.team_id === team.id;
  const full = members.length >= teamSize && !isMember;
  return (
    <article className="team-choice-card">
      <header className="team-choice-card__header">
        <div className="team-choice-card__identity">
          <ImageWell as="span" variant="team" imageSrc={photoUrl}>
            <Icon name="users" className="icon--size-21" />
          </ImageWell>
          <strong className="team-choice-card__name">{team.name}</strong>
        </div>
        <span className="team-choice-card__count">
          {members.length}/{teamSize}
        </span>
      </header>
      <div className="team-members">
        {members.map((player) => (
          <Button
            variant="lobby-member"
            fullWidth={false}
            type="button"
            key={player.id}
            aria-label={player.name}
            aria-pressed={player.id === selectedLobbyPlayerId}
            className={
              player.id === selectedLobbyPlayerId
                ? "btn--lobby-member-selected"
                : ""
            }
            onClick={() => onSelectPlayer(player.id)}
          >
            <Avatar
              name={player.name}
              imageSrc={player.avatar_url}
              variant="member"
            />
            <strong>{player.name}</strong>
          </Button>
        ))}
        {members.length === 0 && <p>Waiting for players</p>}
      </div>
      <Button
        variant="lobby-join"
        fullWidth={false}
        type="button"
        className={`${isMember ? " btn--lobby-join-leave" : ""}`}
        disabled={busy || !selectedPlayer || (full && !isMember)}
        onClick={() =>
          selectedPlayer &&
          void assignTeam(selectedPlayer, isMember ? "" : team.id)
        }
      >
        {isMember
          ? "Leave team"
          : full
            ? "Team full"
            : selectedPlayer
              ? `Add ${selectedPlayer.name}`
              : "Choose a player above"}
      </Button>
    </article>
  );
}
