import StepProgress from "../../components/ui/StepProgress";
import Button from "../../components/ui/Button";
import type { Dispatch, SetStateAction } from "react";
import { type FormEvent } from "react";
import Icon from "../../components/ui/Icon";
import LobbyInviteStep from "./LobbyInviteStep";
import LobbyParticipationStep from "./LobbyParticipationStep";
import LobbyReadyStep from "./LobbyReadyStep";
import LobbyRosterStep from "./LobbyRosterStep";
import LobbyTeamAssignmentStep from "./LobbyTeamAssignmentStep";
import LobbyTeamNamesStep from "./LobbyTeamNamesStep";
import type { GameSession, SessionPlayer, SessionTeam } from "./types";

interface Props {
  lobbyStep: 1 | 2 | 3 | 4 | 5 | 6;
  gamePhotoUrl: string | null;
  session: GameSession;
  joinUrl: string;
  copyCode: () => Promise<void>;
  players: SessionPlayer[];
  hostAvatarPreview: string;
  setHostAvatarFile: Dispatch<SetStateAction<File | null>>;
  setHostAvatarPreview: Dispatch<SetStateAction<string>>;
  hostJoinChoice: boolean | null;
  busy: boolean;
  setHostParticipation: (participates: boolean) => Promise<boolean>;
  hostPlayer: SessionPlayer | undefined;
  teams: SessionTeam[];
  teamById: Map<string, SessionTeam>;
  updatePlayersPerTeam: (size: number) => Promise<void>;
  readyTeamsCount: number;
  selectedLobbyPlayerId: string;
  setSelectedLobbyPlayerId: Dispatch<SetStateAction<string>>;
  unassignedPlayers: SessionPlayer[];
  teamPhotoUrls: Record<string, string>;
  assignTeam: (player: SessionPlayer, teamId: string) => Promise<void>;
  createTeam: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  teamName: string;
  setTeamName: Dispatch<SetStateAction<string>>;
  goToLobbyStep: (step: 1 | 2 | 3 | 4 | 5 | 6) => void;
  teamNameEdits: Record<string, string>;
  setTeamNameEdits: Dispatch<SetStateAction<Record<string, string>>>;
  renameTeam: (team: SessionTeam) => Promise<void>;
  uploadTeamPhoto: (team: SessionTeam, file: File) => Promise<void>;
  startGame: (confirmedOverride?: boolean) => Promise<void>;
}
export default function HostLobby({
  lobbyStep,
  gamePhotoUrl,
  session,
  joinUrl,
  copyCode,
  players,
  hostAvatarPreview,
  setHostAvatarFile,
  setHostAvatarPreview,
  hostJoinChoice,
  busy,
  setHostParticipation,
  hostPlayer,
  teams,
  teamById,
  updatePlayersPerTeam,
  readyTeamsCount,
  selectedLobbyPlayerId,
  setSelectedLobbyPlayerId,
  unassignedPlayers,
  teamPhotoUrls,
  assignTeam,
  createTeam,
  teamName,
  setTeamName,
  goToLobbyStep,
  teamNameEdits,
  setTeamNameEdits,
  renameTeam,
  uploadTeamPhoto,
  startGame,
}: Props) {
  return (
    <section
      className="lobby-setup"
      aria-label={`Game setup step ${lobbyStep} of 6`}
    >
      <header className="lobby-setup__heading">
        <span>STEP {lobbyStep} OF 6</span>
        <StepProgress value={lobbyStep} total={6} />
        <h1>
          {
            (
              [
                "Share the invite",
                "Join your game",
                "Players & teams",
                "Choose your teams",
                "Name your teams",
                "Ready to start",
              ] as const
            )[lobbyStep - 1]
          }
        </h1>
        <p>
          {
            (
              [
                "Share the game link, code or QR so players can join.",
                "Decide whether you’d like to play alongside everyone.",
                "See who has joined and set the team capacity.",
                "Move players into teams and check who is ready.",
                "Give each team a name and picture.",
                "Gather everyone, explain the rules and start the game.",
              ] as const
            )[lobbyStep - 1]
          }
        </p>
      </header>

      {lobbyStep === 1 && (
        <LobbyInviteStep
          gamePhotoUrl={gamePhotoUrl}
          session={session}
          joinUrl={joinUrl}
          copyCode={copyCode}
          players={players}
        />
      )}

      {lobbyStep === 2 && (
        <LobbyParticipationStep
          gamePhotoUrl={gamePhotoUrl}
          session={session}
          hostAvatarPreview={hostAvatarPreview}
          setHostAvatarFile={setHostAvatarFile}
          setHostAvatarPreview={setHostAvatarPreview}
          hostJoinChoice={hostJoinChoice}
          busy={busy}
          setHostParticipation={setHostParticipation}
          hostPlayer={hostPlayer}
        />
      )}

      {lobbyStep === 3 && (
        <LobbyRosterStep
          players={players}
          session={session}
          teams={teams}
          hostPlayer={hostPlayer}
          teamById={teamById}
          busy={busy}
          updatePlayersPerTeam={updatePlayersPerTeam}
        />
      )}

      {lobbyStep === 4 && (
        <LobbyTeamAssignmentStep
          session={session}
          players={players}
          readyTeamsCount={readyTeamsCount}
          teams={teams}
          selectedLobbyPlayerId={selectedLobbyPlayerId}
          setSelectedLobbyPlayerId={setSelectedLobbyPlayerId}
          teamById={teamById}
          unassignedPlayers={unassignedPlayers}
          teamPhotoUrls={teamPhotoUrls}
          busy={busy}
          assignTeam={assignTeam}
          createTeam={createTeam}
          teamName={teamName}
          setTeamName={setTeamName}
          goToLobbyStep={goToLobbyStep}
        />
      )}

      {lobbyStep === 5 && (
        <LobbyTeamNamesStep
          session={session}
          teams={teams}
          teamPhotoUrls={teamPhotoUrls}
          teamNameEdits={teamNameEdits}
          setTeamNameEdits={setTeamNameEdits}
          busy={busy}
          renameTeam={renameTeam}
          uploadTeamPhoto={uploadTeamPhoto}
          players={players}
          assignTeam={assignTeam}
          createTeam={createTeam}
          teamName={teamName}
          setTeamName={setTeamName}
        />
      )}

      {lobbyStep === 6 && (
        <LobbyReadyStep
          gamePhotoUrl={gamePhotoUrl}
          session={session}
          readyTeamsCount={readyTeamsCount}
          teams={teams}
          players={players}
        />
      )}

      <footer className="lobby-setup__actions">
        <Button
          variant="lobby-back"
          fullWidth={false}
          type="button"
          disabled={lobbyStep === 1}
          onClick={() =>
            goToLobbyStep((lobbyStep - 1) as 1 | 2 | 3 | 4 | 5 | 6)
          }
        >
          <Icon name="arrow-left" className="icon--size-16" /> Back
        </Button>
        {lobbyStep < 6 ? (
          <Button
            variant="lobby-next"
            fullWidth={false}
            type="button"
            onClick={() =>
              goToLobbyStep((lobbyStep + 1) as 1 | 2 | 3 | 4 | 5 | 6)
            }
          >
            Next <Icon name="arrow-right" className="icon--size-17" />
          </Button>
        ) : (
          <Button
            variant="lobby-next"
            fullWidth={false}
            type="button"
            disabled={busy}
            onClick={() => void startGame()}
          >
            {busy ? (
              <Icon name="loader-circle" className="icon--size-17 cc-spin" />
            ) : (
              <Icon name="play" className="icon--size-17" />
            )}{" "}
            Start Game
          </Button>
        )}
      </footer>
    </section>
  );
}
