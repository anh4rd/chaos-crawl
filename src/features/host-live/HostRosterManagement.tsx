import HostAccordion from "./HostAccordion";
import {
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import SessionInvite from "../../components/session/SessionInvite";
import Icon from "../../components/ui/Icon";
import Button from "../../components/ui/Button";
import Note from "../../components/ui/Note";
import StatSummary from "../../components/ui/StatSummary";
import RosterPlayerRow from "./RosterPlayerRow";
import RosterTeamCard from "./RosterTeamCard";
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
  onOpenHostJoin,
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
  onOpenHostJoin?: () => void;
  codeCopied: boolean;
  adjustScore: (target: "player" | "team", id: string, delta: number) => void;
  scoreAdjustmentCount: number;
}) {
  const readOnly = session.status === "completed";
  const [addingTeam, setAddingTeam] = useState(false);
  const [search, setSearch] = useState("");
  const largestTeam = Math.max(
    0,
    ...teams.map(
      (team) => players.filter((player) => player.team_id === team.id).length,
    ),
  );
  const teamsEnabled = session.teams_enabled;
  const unassigned = teamsEnabled
    ? players.filter((player) => !player.team_id)
    : [];
  const query = search.trim().toLowerCase();
  const matches = (player: SessionPlayer) =>
    !query || player.name.toLowerCase().includes(query);
  const assigned = players.filter(
    (player) => (!teamsEnabled || player.team_id) && matches(player),
  );
  const renderPlayer = (player: SessionPlayer) => (
    <RosterPlayerRow
      key={player.id}
      player={player}
      teams={teams}
      teamsEnabled={teamsEnabled}
      isHost={player.id === session.host_player_id}
      nameEdit={playerNameEdits[player.id]}
      onNameChange={(name) =>
        setPlayerNameEdits((values) => ({ ...values, [player.id]: name }))
      }
      busy={busy}
      renamePlayer={renamePlayer}
      assignTeam={assignTeam}
    />
  );
  return (
    <div className="host-roster-management">
      {readOnly && (
        <Note variant="session">This completed game is read-only.</Note>
      )}
      <StatSummary
        valueFirst
        items={[
          { label: "Players", value: players.length },
          { label: "Teams", value: teams.length },
          { label: "Unassigned", value: unassigned.length },
        ]}
      />
      <HostAccordion
        icon="users"
        title="Teams"
        status={
          teamsEnabled
            ? `${teams.length} ${teams.length === 1 ? "team" : "teams"}`
            : "Off"
        }
      >
        <fieldset
          disabled={readOnly}
          className="host-roster-management__section"
        >
          <legend className="u-visually-hidden">Teams</legend>
          <div className="host-roster-management__heading">
            {teamsEnabled && (
              <Button
                type="button"
                variant="session-action"
                fullWidth={false}
                aria-expanded={addingTeam}
                onClick={() => setAddingTeam((value) => !value)}
              >
                <Icon
                  name="plus"
                  className="icon--size-15"
                  aria-hidden="true"
                />{" "}
                Add team
              </Button>
            )}
          </div>
          {!teamsEnabled ? (
            <p>Enable teams in session settings to manage them here.</p>
          ) : (
            <>
              {addingTeam && (
                <CreateTeamForm
                  teamName={teamName}
                  setTeamName={setTeamName}
                  teamCount={teams.length}
                  busy={busy}
                  createTeam={createTeam}
                />
              )}
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
              {teams.length === 0 && <p>No teams yet. Add the first one.</p>}
              {teams.map((team, index) => (
                <RosterTeamCard
                  key={team.id}
                  team={team}
                  teams={teams}
                  members={players.filter(
                    (player) => player.team_id === team.id,
                  )}
                  teamSize={session.team_size}
                  index={index}
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
            </>
          )}
        </fieldset>
      </HostAccordion>
      {unassigned.length > 0 && (
        <fieldset
          disabled={readOnly}
          className="host-roster-management__section host-roster-management__section--unassigned"
        >
          <legend className="u-visually-hidden">Unassigned players</legend>
          <div className="host-roster-management__heading">
            <h3>Unassigned ({unassigned.length})</h3>
          </div>
          <ul className="host-roster-management__list">
            {unassigned.filter(matches).map(renderPlayer)}
          </ul>
        </fieldset>
      )}
      <HostAccordion
        icon="medal"
        title="Players"
        status={`${players.length} ${players.length === 1 ? "player" : "players"}`}
      >
        <fieldset
          disabled={readOnly}
          className="host-roster-management__section"
        >
          <legend className="u-visually-hidden">Players</legend>
          <label className="host-roster-management__search">
            <span className="u-visually-hidden">Search players</span>
            <input
              type="search"
              placeholder="Search players"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          {players.length === 0 && <p>No players have joined yet.</p>}
          <ul className="host-roster-management__list">
            {assigned.map(renderPlayer)}
          </ul>
          <p className="host-roster-management__note">
            Players join with the game code. Adding or deleting players and
            teams directly isn&apos;t available yet.
          </p>
        </fieldset>
      </HostAccordion>
      <HostAccordion
        icon="settings"
        title="Host controls"
        status="Add or remove points"
      >
        <ScoreAdjustmentForm
          bare
          players={players}
          teams={session.teams_enabled ? teams : []}
          teamsEnabled={session.teams_enabled}
          busy={busy || readOnly}
          onAdjust={adjustScore}
          successCount={scoreAdjustmentCount}
        />
      </HostAccordion>
      <HostAccordion icon="send" title="Invite players" status="Code and link">
        <SessionInvite
          bare
          joinUrl={joinUrl}
          onCopy={copyCode}
          onOpenHostJoin={onOpenHostJoin}
          copied={codeCopied}
          playerCount={players.length}
          playerLimit={session.player_limit}
          teamsEnabled={session.teams_enabled}
          hostChoosesTeams={session.host_chooses_teams}
        />
      </HostAccordion>
    </div>
  );
}
