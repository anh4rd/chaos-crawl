import JoinProgress from "../../components/ui/JoinProgress";
import Button from "../../components/ui/Button";
import type { Dispatch, SetStateAction } from "react";
import { type FormEvent, useRef, useState } from "react";
import Icon from "../../components/ui/Icon";
import LobbyInviteStep from "./LobbyInviteStep";
import LobbyParticipationStep from "./LobbyParticipationStep";
import LobbyReadyStep from "./LobbyReadyStep";
import LobbyRosterStep from "./LobbyRosterStep";
import LobbyTeamAssignmentStep from "./LobbyTeamAssignmentStep";
import LobbyTeamNamesStep from "./LobbyTeamNamesStep";
import LobbyGameHeading from "./LobbyGameHeading";
import LobbyJoinDisclosure from "./LobbyJoinDisclosure";
import type { GameSession, SessionPlayer, SessionTeam } from "./types";

interface Props {
  lobbyStep: 1 | 2 | 3 | 4 | 5 | 6;
  gamePhotoUrl: string | null;
  session: GameSession;
  joinUrl: string;
  copyCode: () => Promise<void>;
  copyLink: () => Promise<void>;
  codeCopied: boolean;
  linkCopied: boolean;
  players: SessionPlayer[];
  hostAvatarPreview: string;
  setHostAvatarFile: Dispatch<SetStateAction<File | null>>;
  setHostAvatarPreview: Dispatch<SetStateAction<string>>;
  hostPlayerToken: string | null;
  isGameOwner: boolean;
  busy: boolean;
  setHostParticipation: (participates: boolean) => Promise<boolean>;
  ensureHostPlayerToken: () => Promise<string | null>;
  saveHostAvatar: () => Promise<boolean>;
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
  copyLink,
  codeCopied,
  linkCopied,
  players,
  hostAvatarPreview,
  setHostAvatarFile,
  setHostAvatarPreview,
  hostPlayerToken,
  isGameOwner,
  busy,
  setHostParticipation,
  ensureHostPlayerToken,
  saveHostAvatar,
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
  const [photoNeedsSaving, setPhotoNeedsSaving] = useState(false);
  const choiceKey = `chaos-crawl-host-lobby-choice:${session.id}`;
  const [participates, setParticipates] = useState(() => {
    const saved = localStorage.getItem(choiceKey);
    if (saved === "true" || saved === "false") return saved === "true";
    return lobbyStep >= 3 ? session.host_participates : true;
  });
  const [advancing, setAdvancing] = useState(false);
  const advanceLock = useRef(false);
  const [choosing, setChoosing] = useState(false);
  const choiceLock = useRef(false);
  const totalSteps = session.teams_enabled || lobbyStep > 3 ? 6 : 3;

  async function chooseParticipation(participates: boolean) {
    if (choiceLock.current || advanceLock.current) return false;
    choiceLock.current = true;
    setChoosing(true);
    try {
      const saved = await setHostParticipation(participates);
      if (saved) {
        setParticipates(participates);
        localStorage.setItem(choiceKey, String(participates));
        if (participates) setPhotoNeedsSaving(false);
      }
      return saved;
    } finally {
      choiceLock.current = false;
      setChoosing(false);
    }
  }

  async function advanceFromParticipation() {
    if (!isGameOwner) {
      goToLobbyStep(3);
      return;
    }
    if (advanceLock.current || choiceLock.current) return;
    advanceLock.current = true;
    setAdvancing(true);
    try {
      if (participates) {
        const needsRecovery =
          !session.host_participates ||
          !session.host_player_id ||
          !hostPlayerToken;
        if (!(await ensureHostPlayerToken())) return;
        if (photoNeedsSaving && !needsRecovery && !(await saveHostAvatar()))
          return;
        setPhotoNeedsSaving(false);
      } else if (session.host_participates) {
        if (!(await setHostParticipation(false))) return;
      }
      localStorage.setItem(choiceKey, String(participates));
      goToLobbyStep(3);
    } finally {
      advanceLock.current = false;
      setAdvancing(false);
    }
  }

  return (
    <section
      className={`lobby-setup${lobbyStep <= 3 ? " lobby-setup--join" : ""}${lobbyStep === 2 ? " lobby-setup--details" : ""}`}
      aria-label={`Game setup step ${lobbyStep} of ${totalSteps}`}
    >
      <header className="lobby-setup__heading">
        {lobbyStep > 3 && <span>TEAM SETUP</span>}
        <h1>
          {
            (
              [
                "Share the invite",
                isGameOwner ? "Enter your details" : "Host participation",
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
                isGameOwner
                  ? "Decide whether you’d like to play alongside everyone."
                  : "The game owner controls their own player profile.",
                "See who has joined and set the team capacity.",
                "Move players into teams and check who is ready.",
                "Give each team a name and picture.",
                "Gather everyone, explain the rules and start the game.",
              ] as const
            )[lobbyStep - 1]
          }
        </p>
      </header>

      {lobbyStep <= 3 && (
        <LobbyGameHeading
          name={session.name}
          photoUrl={gamePhotoUrl}
          compact={lobbyStep !== 1}
        />
      )}
      <JoinProgress step={lobbyStep} total={totalSteps} />
      {lobbyStep === 1 && (
        <LobbyInviteStep
          session={session}
          joinUrl={joinUrl}
          copyCode={copyCode}
          copyLink={copyLink}
          codeCopied={codeCopied}
          linkCopied={linkCopied}
        />
      )}

      {(lobbyStep === 2 || lobbyStep === 3) && (
        <LobbyJoinDisclosure
          code={session.join_code}
          joinUrl={joinUrl}
          copyCode={copyCode}
          copyLink={copyLink}
          codeCopied={codeCopied}
          linkCopied={linkCopied}
        />
      )}

      {lobbyStep === 2 &&
        (isGameOwner ? (
          <LobbyParticipationStep
            hostAvatarPreview={hostAvatarPreview}
            setHostAvatarFile={(file) => {
              setPhotoNeedsSaving(true);
              setHostAvatarFile(file);
            }}
            setHostAvatarPreview={setHostAvatarPreview}
            hostJoinChoice={participates}
            busy={busy || advancing || choosing}
            setHostParticipation={chooseParticipation}
            hostPlayer={hostPlayer}
          />
        ) : (
          <p>Only the game owner can change host participation.</p>
        ))}

      {lobbyStep === 3 && (
        <>
          <LobbyRosterStep
            players={players}
            session={session}
            hostPlayer={hostPlayer}
            teamById={teamById}
            busy={busy}
            updatePlayersPerTeam={updatePlayersPerTeam}
          />
          <p className="lobby-setup__start-note">
            {session.teams_enabled
              ? "Continue once all players have joined."
              : "Only start the game once all players have joined."}
          </p>
        </>
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
        {lobbyStep !== 1 && (
          <Button
            variant="lobby-back"
            fullWidth={false}
            type="button"
            disabled={busy || advancing || choosing}
            onClick={() =>
              goToLobbyStep((lobbyStep - 1) as 1 | 2 | 3 | 4 | 5 | 6)
            }
          >
            <Icon name="arrow-left" className="icon--size-16" /> Back
          </Button>
        )}
        {lobbyStep < 6 && (lobbyStep !== 3 || session.teams_enabled) ? (
          <Button
            variant="lobby-next"
            fullWidth={false}
            type="button"
            disabled={busy || advancing || choosing}
            onClick={() => {
              if (lobbyStep === 2) void advanceFromParticipation();
              else goToLobbyStep((lobbyStep + 1) as 1 | 2 | 3 | 4 | 5 | 6);
            }}
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
              <Icon
                name="loader-circle"
                className="icon--size-17 icon--spinning-session"
              />
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
