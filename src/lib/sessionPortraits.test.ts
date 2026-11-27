import { beforeEach, expect, it, vi } from "vitest";
import { readSessionPortraits } from "./sessionPortraits";

const rpc = vi.hoisted(() => vi.fn());
vi.mock("./sessionSupabase", () => ({ supabase: { rpc } }));
beforeEach(() => rpc.mockReset());

it("reads player and team photos using the current player credential", async () => {
  const data = {
    players: { player: "player.jpg" },
    teams: { team: "team.jpg" },
  };
  rpc.mockResolvedValue({ data, error: null });
  expect(await readSessionPortraits("123456", "token")).toEqual({
    data,
    error: null,
  });
  expect(rpc).toHaveBeenCalledWith("cc_get_session_portraits", {
    p_join_code: "123456",
    p_player_token: "token",
  });
});

it("rejects malformed portrait data instead of treating it as success", async () => {
  rpc.mockResolvedValue({
    data: { players: { player: null }, teams: {} },
    error: null,
  });
  const result = await readSessionPortraits("123456", "token");
  expect(result.data).toBeNull();
  expect(result.error?.message).toContain("invalid");
});
