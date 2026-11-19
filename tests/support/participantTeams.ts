import type { installSessionBackend } from "./sessionBackend";

type Backend = Awaited<ReturnType<typeof installSessionBackend>>;

export function seedParticipantTeams(
  backend: Backend,
  {
    selectedTeamId = "alpha",
    status = "lobby",
  }: {
    selectedTeamId?: string | null;
    status?: "lobby" | "live";
  } = {},
) {
  backend.session.status = status;
  backend.session.teams_enabled = true;
  backend.session.host_chooses_teams = false;
  backend.session.team_size = 2;
  const teams = [
    { id: "alpha", name: "Alpha", member_count: 2 },
    { id: "beta", name: "Beta", member_count: 1 },
    { id: "gamma", name: "Gamma", member_count: 2 },
  ];
  const player = {
    ...backend.player,
    team_id: selectedTeamId,
    team_name: teams.find((team) => team.id === selectedTeamId)?.name ?? null,
  };
  const view = { ...backend.view, player, teams };
  backend.responses.cc_get_game_session_view = view;
  backend.responses.cc_player_choose_session_team = null;
  backend.responses.cc_player_create_session_team = null;
  return { teams, player, view };
}
