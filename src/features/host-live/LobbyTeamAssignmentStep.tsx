import CreateTeamForm from "./CreateTeamForm";
import TeamChoiceCard from "./TeamChoiceCard";
import StatTile from "../../components/ui/StatTile";
import { Field } from "../../components/ui/Field";
import Avatar from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import ContentPanel from "../../components/ui/ContentPanel";
import type { Dispatch, SetStateAction } from "react";
import { type FormEvent } from "react";
import Icon from "../../components/ui/Icon";
import type { GameSession, SessionPlayer, SessionTeam } from "./types";

interface Props {
  session: GameSession;
  players: SessionPlayer[];
  readyTeamsCount: number;
  teams: SessionTeam[];
  selectedLobbyPlayerId: string;
  setSelectedLobbyPlayerId: Dispatch<SetStateAction<string>>;
  teamById: Map<string, SessionTeam>;
  unassignedPlayers: SessionPlayer[];
  teamPhotoUrls: Record<string, string>;
  busy: boolean;
  assignTeam: (player: SessionPlayer, teamId: string) => Promise<void>;
  createTeam: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  teamName: string;
  setTeamName: Dispatch<SetStateAction<string>>;
  goToLobbyStep: (step: 1 | 2 | 3 | 4 | 5 | 6) => void;
  revisiting?: boolean;
}
export default function LobbyTeamAssignmentStep({
  session,
  players,
  readyTeamsCount,
  teams,
  selectedLobbyPlayerId,
  setSelectedLobbyPlayerId,
  teamById,
  unassignedPlayers,
  teamPhotoUrls,
  busy,
  assignTeam,
  createTeam,
  teamName,
  setTeamName,
  goToLobbyStep,
  revisiting = false,
}: Props) {
  return (
    <ContentPanel
      data-tour="host-lobby-teams"
      as="div"
      variant="lobby"
      className="lobby-team-selection"
    >
      {!session.teams_enabled ? (
        <>
          <h2>Playing solo</h2>
          <p>
            Teams are turned off for this game. Continue to the waiting screen
            when everyone is ready.
          </p>
        </>
      ) : (
        <>
          <div className="metric-grid">
            <StatTile
              variant="compact"
              value={players.length}
              label="Players joined"
            />
            <StatTile
              variant="compact"
              value={
                <>
                  {readyTeamsCount}/{teams.length}
                </>
              }
              label="Teams with players"
            />
          </div>
          <Field variant="lobby" label="Choose a player to move">
            <select
              value={selectedLobbyPlayerId}
              onChange={(event) => setSelectedLobbyPlayerId(event.target.value)}
            >
              <option value="">Select a player…</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                  {player.team_id
                    ? ` · ${teamById.get(player.team_id)?.name ?? "In a team"}`
                    : " · Unassigned"}
                </option>
              ))}
            </select>
          </Field>
          <div className="player-tray" aria-label="Players not yet in a team">
            {unassignedPlayers.map((player) => (
              <Button
                variant="lobby-player"
                fullWidth={false}
                type="button"
                className={`${player.id === selectedLobbyPlayerId ? " btn--lobby-player-selected" : ""}`}
                key={player.id}
                aria-label={player.name}
                aria-pressed={player.id === selectedLobbyPlayerId}
                onClick={() => setSelectedLobbyPlayerId(player.id)}
              >
                <Avatar
                  name={player.name}
                  imageSrc={player.avatar_url}
                  variant="compact"
                />
                <strong>{player.name}</strong>
              </Button>
            ))}
            {unassignedPlayers.length === 0 && (
              <p>Everyone is in a team. Choose a player above to move them.</p>
            )}
          </div>
          <div className="team-choice-list">
            {teams.map((team) => (
              <TeamChoiceCard
                key={team.id}
                team={team}
                members={players.filter((player) => player.team_id === team.id)}
                selectedPlayer={players.find(
                  (player) => player.id === selectedLobbyPlayerId,
                )}
                selectedLobbyPlayerId={selectedLobbyPlayerId}
                teamSize={session.team_size}
                photoUrl={teamPhotoUrls[team.id]}
                busy={busy}
                onSelectPlayer={setSelectedLobbyPlayerId}
                assignTeam={assignTeam}
              />
            ))}
          </div>
          <CreateTeamForm
            teamName={teamName}
            setTeamName={setTeamName}
            teamCount={teams.length}
            busy={busy}
            createTeam={createTeam}
          />
          {!revisiting && (
            <Button
              variant="lobby-shortcut"
              fullWidth={false}
              type="button"
              onClick={() => goToLobbyStep(6)}
            >
              Start Game <Icon name="arrow-right" className="icon--size-15" />
            </Button>
          )}
        </>
      )}
    </ContentPanel>
  );
}
