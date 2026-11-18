import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { hostSessionFixture } from "./testFixtures";
import { useHostParticipation } from "./useHostParticipation";
import { hostPlayerStorageKey } from "./hostParticipationStorage";
const commands = vi.hoisted(() => ({
  updateHostParticipation: vi.fn(),
  hostJoinAsPlayer: vi.fn(),
  uploadHostAvatar: vi.fn(),
  readHostPlayerIdentity: vi.fn(),
  updateHostAvatar: vi.fn(),
}));
vi.mock("../../lib/hostRosterCommands", () => commands);
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  commands.updateHostParticipation.mockResolvedValue({
    data: null,
    error: null,
  });
  commands.hostJoinAsPlayer.mockResolvedValue({
    data: { player_token: "host-token", join_code: "123456", name: "Host" },
    error: null,
  });
});
function options(): Parameters<typeof useHostParticipation>[0] {
  return {
    sessionId: "session",
    session: hostSessionFixture(),
    hostPlayerName: "  Named Host  ",
    setBusy: vi.fn(() => true),
    setError: vi.fn(),
    setNotice: vi.fn(),
    setSession: vi.fn(),
    setActiveTab: vi.fn(),
    load: vi.fn(async () => {}),
  };
}
it("reports failed join recovery without claiming success or overwriting its specific error", async () => {
  commands.hostJoinAsPlayer.mockResolvedValue({
    data: null,
    error: { message: "Participation migration missing" },
  });
  const props = options();
  const { result } = renderHook(() => useHostParticipation(props));
  let joined: boolean | undefined;
  await act(async () => {
    joined = await result.current.setHostParticipation(true);
  });
  expect(joined).toBe(false);
  expect(props.setError).toHaveBeenLastCalledWith(
    "Participation migration missing",
  );
  expect(props.load).not.toHaveBeenCalled();
});
it("returns an existing valid host credential without joining or moving navigation", async () => {
  localStorage.setItem(hostPlayerStorageKey("session"), "saved-token");
  const props = options();
  props.session = hostSessionFixture({
    host_participates: true,
    host_player_id: "host-player",
  });
  const { result } = renderHook(() => useHostParticipation(props));
  const recovered = vi.fn();
  let token: string | null = null;
  await act(async () => {
    token = await result.current.ensureHostPlayerToken(recovered);
  });
  expect(token).toBe("saved-token");
  expect(recovered).not.toHaveBeenCalled();
  expect(commands.updateHostParticipation).not.toHaveBeenCalled();
});
it.each(["participation", "profile", "token"])(
  "recovers a missing %s through the same ordered commands and storage keys",
  async (missing) => {
    if (missing !== "token")
      localStorage.setItem(hostPlayerStorageKey("session"), "old-token");
    const props = options();
    props.session = hostSessionFixture({
      host_participates: missing !== "participation",
      host_player_id: missing === "profile" ? null : "host-player",
    });
    const { result } = renderHook(() => useHostParticipation(props));
    const recovered = vi.fn();
    let token: string | null = null;
    await act(async () => {
      token = await result.current.ensureHostPlayerToken(recovered);
    });
    expect(token).toBe("host-token");
    expect(recovered).toHaveBeenCalledOnce();
    expect(commands.updateHostParticipation).toHaveBeenCalledWith(
      { host_participates: true },
      "session",
    );
    expect(commands.hostJoinAsPlayer).toHaveBeenCalledWith({
      p_session_id: "session",
      p_player_name: "Named Host",
    });
    expect(
      commands.updateHostParticipation.mock.invocationCallOrder[0],
    ).toBeLessThan(commands.hostJoinAsPlayer.mock.invocationCallOrder[0] ?? 0);
    expect(localStorage.getItem(hostPlayerStorageKey("session"))).toBe(
      "host-token",
    );
    expect(localStorage.getItem("chaos-crawl-session-player:123456")).toBe(
      "host-token",
    );
    expect(props.setActiveTab).toHaveBeenLastCalledWith("game");
    expect(props.load).toHaveBeenCalledOnce();
  },
);
it("preserves specific missing-token and busy refusal outcomes", async () => {
  const props = options();
  commands.hostJoinAsPlayer.mockResolvedValue({ data: {}, error: null });
  const { result, rerender } = renderHook(
    ({ value }) => useHostParticipation(value),
    { initialProps: { value: props } },
  );
  const recovered = vi.fn();
  await act(async () => {
    expect(await result.current.ensureHostPlayerToken(recovered)).toBeNull();
  });
  expect(props.setError).toHaveBeenLastCalledWith(
    "The host player profile was created, but no player token was returned. Check the host participation migration.",
  );
  expect(recovered).not.toHaveBeenCalled();
  commands.updateHostParticipation.mockClear();
  rerender({ value: { ...props, setBusy: vi.fn(() => false) } });
  await act(async () => {
    expect(await result.current.ensureHostPlayerToken(recovered)).toBeNull();
  });
  expect(commands.updateHostParticipation).not.toHaveBeenCalled();
});
