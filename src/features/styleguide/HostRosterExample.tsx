import { useState } from "react";
import HostRosterManagement from "../host-live/HostRosterManagement";
import HostManagement from "../host-live/HostManagement";
import type {
  GameSession,
  SessionPlayer,
  SessionTeam,
} from "../host-live/types";
import SessionPreview from "../../components/session/SessionPreview";
import Note from "../../components/ui/Note";
import { Example } from "./Example";

const sampleSession: GameSession = {
  id: "local",
  host_game_id: null,
  host_id: "local",
  name: "Sample party",
  event_date: null,
  start_time: null,
  end_time: null,
  venue_name: null,
  join_code: "123456",
  status: "live",
  teams_enabled: true,
  host_chooses_teams: true,
  team_size: 2,
  player_limit: 12,
  host_participates: false,
  host_player_id: null,
  secret_mission_points: 10,
  current_round_number: 1,
  reward_methods: ["host_awards"],
  created_at: "2030-01-01",
  final_gallery_open: false,
  final_voting_open: false,
  final_vote_completed_at: null,
  final_vote_winner_player_id: null,
  final_vote_winner_evidence_id: null,
  final_vote_winner_points: 0,
  final_vote_winner_vote_count: 0,
};

export default function HostRosterExample() {
  const [session, setSession] = useState(sampleSession);
  const [players, setPlayers] = useState<SessionPlayer[]>([
    {
      id: "player",
      name: "Pat",
      avatar_url: null,
      team_id: null,
      score: 20,
      joined_at: "2030-01-01",
      last_seen_at: "2030-01-01",
    },
  ]);
  const [teams, setTeams] = useState<SessionTeam[]>([
    {
      id: "team",
      name: "Team Chaos",
      created_at: "2030-01-01",
      manual_score_adjustment: 0,
    },
  ]);
  const [teamName, setTeamName] = useState("");
  const [teamNameEdits, setTeamNameEdits] = useState<Record<string, string>>({
    team: "Team Chaos",
  });
  const [playerNameEdits, setPlayerNameEdits] = useState<
    Record<string, string>
  >({ player: "Pat" });
  const [notice, setNotice] = useState("Changes in this example stay local.");
  return (
    <Example
      title="Host roster management"
      source="src/features/host-live/HostRosterManagement.tsx"
      code="<HostRosterManagement {...props} />"
    >
      <SessionPreview>
        <HostManagement>
          <HostRosterManagement
            session={session}
            players={players}
            teams={teams}
            teamPhotoUrls={{}}
            teamName={teamName}
            setTeamName={setTeamName}
            teamNameEdits={teamNameEdits}
            setTeamNameEdits={setTeamNameEdits}
            playerNameEdits={playerNameEdits}
            setPlayerNameEdits={setPlayerNameEdits}
            busy={false}
            createTeam={async (event) => {
              event.preventDefault();
              const name = teamName.trim();
              if (!name) return;
              const id = `team-${teams.length}`;
              setTeams((current) => [
                ...current,
                {
                  id,
                  name,
                  created_at: "2030-01-01",
                  manual_score_adjustment: 0,
                },
              ]);
              setTeamNameEdits((current) => ({ ...current, [id]: name }));
              setTeamName("");
            }}
            renameTeam={async (team) => {
              const name = teamNameEdits[team.id]?.trim();
              if (name)
                setTeams((current) =>
                  current.map((item) =>
                    item.id === team.id ? { ...item, name } : item,
                  ),
                );
            }}
            renamePlayer={async (player) => {
              const name = playerNameEdits[player.id]?.trim();
              if (name)
                setPlayers((current) =>
                  current.map((item) =>
                    item.id === player.id ? { ...item, name } : item,
                  ),
                );
            }}
            uploadTeamPhoto={async (_, file) =>
              setNotice(`Selected ${file.name} locally.`)
            }
            assignTeam={async (player, teamId) => {
              if (
                teamId &&
                players.filter(
                  (item) => item.id !== player.id && item.team_id === teamId,
                ).length >= session.team_size
              ) {
                setNotice("Sample team is full.");
                return;
              }
              setPlayers((current) =>
                current.map((item) =>
                  item.id === player.id
                    ? { ...item, team_id: teamId || null }
                    : item,
                ),
              );
            }}
            updatePlayersPerTeam={async (size) =>
              setSession((current) => ({ ...current, team_size: size }))
            }
            joinUrl="#/styleguide"
            copyCode={() => setNotice("Copy selected locally.")}
            onOpenHostJoin={() =>
              setNotice("Sample host join screen opened locally.")
            }
            codeCopied={false}
            adjustScore={(target, id, delta) => {
              if (target === "player")
                setPlayers((current) =>
                  current.map((player) =>
                    player.id === id
                      ? { ...player, score: player.score + delta }
                      : player,
                  ),
                );
              else
                setTeams((current) =>
                  current.map((team) =>
                    team.id === id
                      ? {
                          ...team,
                          manual_score_adjustment:
                            team.manual_score_adjustment + delta,
                        }
                      : team,
                  ),
                );
              setNotice("Score adjusted locally.");
            }}
            scoreAdjustmentCount={0}
          />
        </HostManagement>
      </SessionPreview>
      <Note as="output">{notice}</Note>
    </Example>
  );
}
