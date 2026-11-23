import type { Dispatch, FormEvent, SetStateAction } from "react";
import SessionInvite from "../../components/session/SessionInvite";
import Avatar from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import ContentPanel from "../../components/ui/ContentPanel";
import Note from "../../components/ui/Note";
import TeamEditor from "./TeamEditor";
import CreateTeamForm from "./CreateTeamForm";
import ScoreAdjustmentForm from "./ScoreAdjustmentForm";
import type { GameSession, SessionPlayer, SessionTeam } from "./types";

export default function HostRosterManagement({
  session,
  players,
  teams,
  teamPhotoUrls,
  teamName,
  setTeamName,
  teamNameEdits,
  setTeamNameEdits,
  playerNameEdits,
  setPlayerNameEdits,
  busy,
  createTeam,
  renameTeam,
  renamePlayer,
  uploadTeamPhoto,
  assignTeam,
  updatePlayersPerTeam,
  joinUrl,
  copyCode,
  codeCopied,
  adjustScore,
  scoreAdjustmentCount,
}: {
  session: GameSession;
  players: SessionPlayer[];
  teams: SessionTeam[];
  teamPhotoUrls: Record<string, string>;
  teamName: string;
  setTeamName: (name: string) => void;
  teamNameEdits: Record<string, string>;
  setTeamNameEdits: Dispatch<SetStateAction<Record<string, string>>>;
  playerNameEdits: Record<string, string>;
  setPlayerNameEdits: Dispatch<SetStateAction<Record<string, string>>>;
  busy: boolean;
  createTeam: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  renameTeam: (team: SessionTeam) => Promise<void>;
  renamePlayer: (player: SessionPlayer) => Promise<void>;
  uploadTeamPhoto: (team: SessionTeam, file: File) => Promise<void>;
  assignTeam: (player: SessionPlayer, teamId: string) => Promise<void>;
  updatePlayersPerTeam: (size: number) => Promise<void>;
  joinUrl: string;
  copyCode: () => void | Promise<void>;
  codeCopied: boolean;
  adjustScore: (target: "player" | "team", id: string, delta: number) => void;
  scoreAdjustmentCount: number;
}) {
  const readOnly = session.status === "completed";
  const largestTeam = Math.max(
    0,
    ...teams.map(
      (team) => players.filter((player) => player.team_id === team.id).length,
    ),
  );
  return (
    <div className="host-roster-management">
      <ContentPanel variant="session" stacked>
        <h2>Manage teams and players</h2>
        <p>
          Players join with the game code. Names, team assignments and team
          details can be changed here.
        </p>
        {readOnly && (
          <Note variant="session">This completed game is read-only.</Note>
        )}
        <p>
          Adding players directly and deleting players or teams are not
          available in this game yet.
        </p>
        <fieldset
          disabled={readOnly}
          className="host-roster-management__fields"
        >
          <legend>Players</legend>
          {players.length === 0 && <p>No players have joined yet.</p>}
          {players.map((player) => (
            <div className="host-roster-management__player" key={player.id}>
              <Avatar
                name={player.name}
                imageSrc={player.avatar_url}
                variant="compact"
              />
              <label>
                Name for {player.name}
                <input
                  maxLength={60}
                  value={playerNameEdits[player.id] ?? player.name}
                  onChange={(event) =>
                    setPlayerNameEdits((values) => ({
                      ...values,
                      [player.id]: event.target.value,
                    }))
                  }
                />
              </label>
              <Button
                type="button"
                variant="control"
                fullWidth={false}
                disabled={
                  busy ||
                  !playerNameEdits[player.id]?.trim() ||
                  playerNameEdits[player.id]?.trim() === player.name
                }
                onClick={() => void renamePlayer(player)}
              >
                Save name
              </Button>
              {session.teams_enabled && (
                <label>
                  Team for {player.name}
                  <select
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
                </label>
              )}
            </div>
          ))}
        </fieldset>
        <fieldset
          disabled={readOnly}
          className="host-roster-management__fields"
        >
          <legend>Teams</legend>
          {!session.teams_enabled ? (
            <p>Enable teams in session settings to manage them here.</p>
          ) : (
            <>
              <label className="host-roster-management__capacity">
                Players per team
                <select
                  value={session.team_size}
                  disabled={busy}
                  onChange={(event) =>
                    void updatePlayersPerTeam(Number(event.target.value))
                  }
                >
                  {[...new Set([session.team_size, 2, 3, 4, 5, 6, 8, 10, 12])]
                    .sort((a, b) => a - b)
                    .filter(
                      (size) =>
                        size === session.team_size || size >= largestTeam,
                    )
                    .map((size) => (
                      <option key={size} value={size}>
                        {size} players
                      </option>
                    ))}
                </select>
              </label>
              {teams.map((team) => (
                <TeamEditor
                  key={team.id}
                  team={team}
                  teams={teams}
                  members={[]}
                  photoUrl={teamPhotoUrls[team.id]}
                  nameEdit={teamNameEdits[team.id]}
                  onNameChange={(name) =>
                    setTeamNameEdits((values) => ({
                      ...values,
                      [team.id]: name,
                    }))
                  }
                  busy={busy}
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
        </fieldset>
      </ContentPanel>
      <ScoreAdjustmentForm
        players={players}
        teams={session.teams_enabled ? teams : []}
        teamsEnabled={session.teams_enabled}
        busy={busy || readOnly}
        onAdjust={adjustScore}
        successCount={scoreAdjustmentCount}
      />
      <SessionInvite
        joinUrl={joinUrl}
        onCopy={copyCode}
        copied={codeCopied}
        playerCount={players.length}
        playerLimit={session.player_limit}
        teamsEnabled={session.teams_enabled}
        hostChoosesTeams={session.host_chooses_teams}
      />
    </div>
  );
}
