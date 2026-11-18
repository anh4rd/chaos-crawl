import { beforeEach, expect, it, vi } from "vitest";
import { readPlatformGames, readPlatformGameDetail } from "./superAdminQueries";
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("./sessionSupabase", () => ({ supabase: { rpc } }));
vi.mock("./monitoring", () => ({ reportError: vi.fn() }));
beforeEach(() => {
  vi.resetAllMocks();
});
it("normalizes rejected list transport failures and keeps the no-argument RPC", async () => {
  rpc.mockRejectedValueOnce(new Error("List offline"));
  await expect(readPlatformGames()).resolves.toEqual({
    data: null,
    error: { message: "List offline" },
  });
  expect(rpc).toHaveBeenCalledExactlyOnceWith("cc_super_admin_list_games");
});
it("normalizes rejected detail transports without changing the selected-id payload", async () => {
  rpc.mockRejectedValueOnce(new Error("Details offline"));
  await expect(readPlatformGameDetail("chosen-game")).resolves.toEqual({
    data: null,
    error: { message: "Details offline" },
  });
  expect(rpc).toHaveBeenCalledExactlyOnceWith("cc_super_admin_game_detail", {
    p_game_id: "chosen-game",
  });
});
