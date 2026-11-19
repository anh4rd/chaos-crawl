import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createInvitationFixture } from "../../../tests/support/invitation";
import { useInvitationData } from "./useInvitationData";
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("../../lib/sessionSupabase", () => ({ supabase: { rpc } }));
beforeEach(() => rpc.mockReset());
afterEach(cleanup);
it("cleans the public code and renders the returned invitation", async () => {
  rpc.mockResolvedValue({ data: createInvitationFixture(), error: null });
  const { result } = renderHook(() => useInvitationData("12ab34-5678"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(rpc).toHaveBeenCalledWith("cc_get_public_game_invite", {
    p_join_code: "123456",
  });
  expect(result.current.invite?.game_name).toBe("Friday Night Chaos");
  expect(result.current.error).toBe("");
});
it("distinguishes missing invitations from closed invitations", async () => {
  rpc.mockResolvedValue({ data: null, error: null });
  const { result, unmount } = renderHook(() => useInvitationData("123456"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error).toContain("couldn't be found");
  unmount();
  rpc.mockResolvedValue({
    data: { ...createInvitationFixture(), enabled: false },
    error: null,
  });
  const closed = renderHook(() => useInvitationData("654321"));
  await waitFor(() => expect(closed.result.current.loading).toBe(false));
  expect(closed.result.current.error).toContain("hasn't opened");
});
it("ignores a late response belonging to the previous code", async () => {
  let finish: (value: unknown) => void = () => {};
  rpc
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValue({
      data: { ...createInvitationFixture(), game_name: "New event" },
      error: null,
    });
  const { result, rerender } = renderHook(
    ({ code }) => useInvitationData(code),
    { initialProps: { code: "123456" } },
  );
  rerender({ code: "654321" });
  await waitFor(() =>
    expect(result.current.invite?.game_name).toBe("New event"),
  );
  await act(async () => {
    finish({ data: createInvitationFixture(), error: null });
  });
  expect(result.current.invite?.game_name).toBe("New event");
});
