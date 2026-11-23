import { beforeEach, expect, it, vi } from "vitest";
import { updateHostPlan } from "./hostPlanApi";
import { saveBreakChallenge, saveHostPlanTasks } from "./hostSessionCommands";
import {
  assignSessionTeam,
  renameSessionPlayer,
  renameSessionTeam,
  saveTeamPhoto,
  updateHostAvatar,
} from "./hostRosterCommands";
import { createPlanWrite } from "../features/host-planning/planModel";
import { defaultForm } from "../features/host-planning/catalog";
const mocks = vi.hoisted(() => {
  const trace: unknown[][] = [];
  const execute = vi.fn<() => Promise<{ data: unknown; error: unknown }>>();
  const query = {
    update: (values: unknown) => {
      trace.push(["update", values]);
      return query;
    },
    eq: (name: string, value: unknown) => {
      trace.push(["eq", name, value]);
      return query;
    },
    select: (columns: string) => {
      trace.push(["select", columns]);
      return query;
    },
    maybeSingle: () => execute(),
    then: (
      ...args: Parameters<Promise<{ data: unknown; error: unknown }>["then"]>
    ) => execute().then(...args),
  };
  return {
    trace,
    execute,
    from: (table: string) => {
      trace.push(["from", table]);
      return query;
    },
  };
});
vi.mock("./sessionSupabase", () => ({ supabase: { from: mocks.from } }));
vi.mock("./monitoring", () => ({ reportError: vi.fn() }));
beforeEach(() => {
  mocks.trace.length = 0;
  mocks.execute
    .mockReset()
    .mockResolvedValue({ data: { changed: true }, error: null });
});
function commands() {
  const { host_id: hostId, ...planValues } = createPlanWrite(
    defaultForm,
    "owner-22",
    "draft",
  );
  const tasks = {
    plan_data: {
      selectedTasks: [{ id: "task-77", title: "Saved", equipment: ["Hat"] }],
      extra: { preserved: true },
    },
  };
  const challenge = {
    title: "Challenge",
    description: "Description",
    duration_minutes: 3,
    points: 0,
    allow_photo_upload: true,
  };
  const avatar = { avatar_url: "avatar.jpg" };
  const team = { name: "Named team" };
  const photos = {
    plan_data: {
      teamPhotoUrls: { "squad-66": "team.jpg" },
      extra: ["preserved"],
    },
  };
  const assignment = { team_id: "squad-66" };
  return [
    {
      name: "updateHostPlan",
      run: () =>
        updateHostPlan({
          hostGameId: "saved-plan-11",
          hostId,
          values: planValues,
        }),
      table: "host_games",
      values: planValues,
      filters: [
        ["id", "saved-plan-11"],
        ["host_id", "owner-22"],
      ],
    },
    {
      name: "saveHostPlanTasks",
      run: () =>
        saveHostPlanTasks({
          hostGameId: "saved-plan-11",
          hostId: "owner-22",
          values: tasks,
        }),
      table: "host_games",
      values: tasks,
      filters: [
        ["id", "saved-plan-11"],
        ["host_id", "owner-22"],
      ],
    },
    {
      name: "saveBreakChallenge",
      run: () =>
        saveBreakChallenge({
          challengeId: "round-challenge-44",
          sessionId: "live-session-33",
          values: challenge,
        }),
      table: "cc_game_session_challenges",
      values: challenge,
      filters: [
        ["id", "round-challenge-44"],
        ["session_id", "live-session-33"],
      ],
    },
    {
      name: "updateHostAvatar",
      run: () =>
        updateHostAvatar({
          playerId: "participant-55",
          sessionId: "live-session-33",
          values: avatar,
        }),
      table: "cc_game_session_players",
      values: avatar,
      filters: [
        ["id", "participant-55"],
        ["session_id", "live-session-33"],
      ],
    },
    {
      name: "renameSessionTeam",
      run: () =>
        renameSessionTeam({
          teamId: "squad-66",
          sessionId: "live-session-33",
          values: team,
        }),
      table: "cc_game_session_teams",
      values: team,
      filters: [
        ["id", "squad-66"],
        ["session_id", "live-session-33"],
      ],
    },
    {
      name: "saveTeamPhoto",
      run: () =>
        saveTeamPhoto({
          hostGameId: "saved-plan-11",
          hostId: "owner-22",
          values: photos,
        }),
      table: "host_games",
      values: photos,
      filters: [
        ["id", "saved-plan-11"],
        ["host_id", "owner-22"],
      ],
    },
    {
      name: "assignSessionTeam",
      run: () =>
        assignSessionTeam({
          playerId: "participant-55",
          sessionId: "live-session-33",
          values: assignment,
        }),
      table: "cc_game_session_players",
      values: assignment,
      filters: [
        ["id", "participant-55"],
        ["session_id", "live-session-33"],
      ],
    },
  ];
}
it.each(commands())(
  "$name keeps exact values and ordered distinct-ID filters",
  async ({ run, table, values, filters }) => {
    const result = await run();
    expect(mocks.trace).toEqual([
      ["from", table],
      ["update", values],
      ...filters.map(([key, value]) => ["eq", key, value]),
    ]);
    expect(result).toEqual({ data: { changed: true }, error: null });
  },
);
it.each(commands())(
  "$name retains database and rejected transport result contracts",
  async ({ run }) => {
    mocks.execute.mockResolvedValueOnce({
      data: null,
      error: { message: "Denied", code: "42501" },
    });
    expect(await run()).toEqual({
      data: null,
      error: { message: "Denied", code: "42501" },
    });
    mocks.execute.mockRejectedValueOnce(new Error("Offline"));
    expect(await run()).toEqual({ data: null, error: { message: "Offline" } });
  },
);
it("keeps null team assignment as an explicit unassignment", async () => {
  await assignSessionTeam({
    playerId: "participant-55",
    sessionId: "live-session-33",
    values: { team_id: null },
  });
  expect(mocks.trace).toEqual([
    ["from", "cc_game_session_players"],
    ["update", { team_id: null }],
    ["eq", "id", "participant-55"],
    ["eq", "session_id", "live-session-33"],
  ]);
});
it("renames a player only within the session and requests the affected identity", async () => {
  mocks.execute.mockResolvedValueOnce({
    data: { id: "participant-55" },
    error: null,
  });
  expect(
    await renameSessionPlayer({
      playerId: "participant-55",
      sessionId: "live-session-33",
      values: { name: "Pat" },
    }),
  ).toEqual({ data: { id: "participant-55" }, error: null });
  expect(mocks.trace).toEqual([
    ["from", "cc_game_session_players"],
    ["update", { name: "Pat" }],
    ["eq", "id", "participant-55"],
    ["eq", "session_id", "live-session-33"],
    ["select", "id"],
  ]);
});
