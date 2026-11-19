import CreateTeamForm from "./CreateTeamForm";
import TeamEditor from "./TeamEditor";
import Note from "../../components/ui/Note";
import ContentPanel from "../../components/ui/ContentPanel";
import type { Dispatch, SetStateAction } from "react";
import { type FormEvent } from "react";
import type { GameSession, SessionPlayer, SessionTeam } from "./types";

interface Props {
  session: GameSession;
  teams: SessionTeam[];
  teamPhotoUrls: Record<string, string>;
  teamNameEdits: Record<string, string>;
  setTeamNameEdits: Dispatch<SetStateAction<Record<string, string>>>;
  busy: boolean;
  renameTeam: (team: SessionTeam) => Promise<void>;
  uploadTeamPhoto: (team: SessionTeam, file: File) => Promise<void>;
  players: SessionPlayer[];
  assignTeam: (player: SessionPlayer, teamId: string) => Promise<void>;
  createTeam: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  teamName: string;
  setTeamName: Dispatch<SetStateAction<string>>;
}
export default function LobbyTeamNamesStep({
  session,
  teams,
  teamPhotoUrls,
  teamNameEdits,
  setTeamNameEdits,
  busy,
  renameTeam,
  uploadTeamPhoto,
  players,
  assignTeam,
  createTeam,
  teamName,
  setTeamName,
}: Props) {
  return (
    <ContentPanel
      data-tour="host-lobby-team-names"
      as="div"
      variant="lobby"
      className="lobby-team-names"
    >
      <h2>Edit teams and players</h2>
      <p>
        Set team names and add a picture. You can still move players between
        teams here.
      </p>
      {!session.teams_enabled ? (
        <Note variant="lobby">
          This game is set up for individual players, so team setup is skipped.
        </Note>
      ) : (
        <>
          {teams.map((team) => (
            <TeamEditor
              key={team.id}
              team={team}
              teams={teams}
              members={players.filter((player) => player.team_id === team.id)}
              photoUrl={teamPhotoUrls[team.id]}
              nameEdit={teamNameEdits[team.id]}
              busy={busy}
              onNameChange={(name) =>
                setTeamNameEdits((values) => ({ ...values, [team.id]: name }))
              }
              renameTeam={renameTeam}
              uploadTeamPhoto={uploadTeamPhoto}
              assignTeam={assignTeam}
            />
          ))}
          <CreateTeamForm
            teamName={teamName}
            setTeamName={setTeamName}
            teamCount={teams.length}
            busy={busy}
            createTeam={createTeam}
          />
        </>
      )}
    </ContentPanel>
  );
}
