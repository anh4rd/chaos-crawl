import { beforeEach, expect, it, vi } from "vitest";
import {
  createLegacyHostPlayer,
  createLegacyHostTeam,
  assignLegacyHostTeam,
} from "./legacyHostCommands";
import {
  readLegacyHostTeams,
  subscribeLegacyHostTeams,
} from "./legacyHostQueries";
const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  order: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  channel: vi.fn(),
  on: vi.fn(),
  subscribe: vi.fn(),
  removeChannel: vi.fn(),
}));
vi.mock("./supabase", () => ({ supabase: mocks }));
vi.mock("./monitoring", () => ({ reportError: vi.fn() }));
beforeEach(() => {
  vi.resetAllMocks();
  mocks.from.mockReturnValue({
    select: mocks.select,
    insert: mocks.insert,
    update: mocks.update,
  });
  mocks.select.mockReturnValue({ order: mocks.order });
  mocks.update.mockReturnValue({ eq: mocks.eq });
  mocks.order.mockResolvedValue({ data: [], error: null });
  mocks.insert.mockResolvedValue({ data: null, error: null });
  mocks.eq.mockResolvedValue({ data: null, error: null });
  const channel = { on: mocks.on, subscribe: mocks.subscribe };
  mocks.channel.mockReturnValue(channel);
  mocks.on.mockReturnValue(channel);
  mocks.subscribe.mockReturnValue(channel);
});

it("legacy team reads preserve the exact select/order and channel/filter/cleanup contract", async () => {
  await readLegacyHostTeams();
  expect(mocks.from).toHaveBeenCalledExactlyOnceWith("teams");
  expect(mocks.select).toHaveBeenCalledExactlyOnceWith("id, name");
  expect(mocks.order).toHaveBeenCalledExactlyOnceWith("name");
  const refresh = vi.fn();
  const cleanup = subscribeLegacyHostTeams(refresh);
  expect(mocks.channel).toHaveBeenCalledExactlyOnceWith("host-v2-teams");
  expect(mocks.on).toHaveBeenCalledExactlyOnceWith(
    "postgres_changes",
    { event: "*", schema: "public", table: "teams" },
    refresh,
  );
  cleanup();
  expect(mocks.removeChannel).toHaveBeenCalledExactlyOnceWith(
    mocks.channel.mock.results[0]?.value,
  );
});

it("legacy creations keep their bodies without selecting extra returned records", async () => {
  await createLegacyHostTeam("Owls");
  expect(mocks.from).toHaveBeenNthCalledWith(1, "teams");
  expect(mocks.insert).toHaveBeenNthCalledWith(1, { name: "Owls" });
  await createLegacyHostPlayer("Kai");
  expect(mocks.from).toHaveBeenNthCalledWith(2, "players");
  expect(mocks.insert).toHaveBeenNthCalledWith(2, {
    name: "Kai",
    team: null,
    score: 0,
  });
  expect(mocks.select).not.toHaveBeenCalled();
});

it("legacy assignment preserves id-only filters, raw stored names and null unassignment", async () => {
  await assignLegacyHostTeam("p1", "  Existing team  ");
  expect(mocks.update).toHaveBeenNthCalledWith(1, {
    team: "  Existing team  ",
  });
  expect(mocks.eq).toHaveBeenNthCalledWith(1, "id", "p1");
  await assignLegacyHostTeam("p1", "");
  expect(mocks.update).toHaveBeenNthCalledWith(2, { team: null });
  expect(mocks.eq).toHaveBeenNthCalledWith(2, "id", "p1");
});

for (const operation of ["read", "team", "player", "assign"]) {
  it(`a thrown ${operation} SDK failure returns the ordinary recoverable result`, async () => {
    const error = new Error("Transport unavailable");
    if (operation === "read") mocks.order.mockRejectedValueOnce(error);
    else if (operation === "assign") mocks.eq.mockRejectedValueOnce(error);
    else mocks.insert.mockRejectedValueOnce(error);
    const promise =
      operation === "read"
        ? readLegacyHostTeams()
        : operation === "team"
          ? createLegacyHostTeam("Owls")
          : operation === "player"
            ? createLegacyHostPlayer("Kai")
            : assignLegacyHostTeam("p1", "Owls");
    await expect(promise).resolves.toEqual({
      data: null,
      error: { message: "Transport unavailable" },
    });
  });
}
