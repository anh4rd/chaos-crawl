import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useHostIdentity } from "./useHostIdentity";
const mocks = vi.hoisted(() => ({ identity: vi.fn(), direct: vi.fn() }));
vi.mock("../../lib/hostAuth", () => ({ readHostIdentity: mocks.identity }));
vi.mock("../../lib/sessionSupabase", () => ({
  supabase: { auth: { getUser: mocks.direct } },
}));
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.direct.mockResolvedValue({ data: { user: null }, error: null });
});
it.each([
  { metadata: "Named host", email: "other@example.test", name: "Named host" },
  { metadata: undefined, email: "email@example.test", name: "email" },
  { metadata: "", email: "email@example.test", name: "" },
  { metadata: undefined, email: undefined, name: "Host" },
])(
  "uses the shared SDK boundary and preserves $name fallback",
  async ({ metadata, email, name }) => {
    mocks.identity.mockResolvedValue({
      data: {
        user: { id: "owner", user_metadata: { display_name: metadata }, email },
      },
      error: null,
    });
    const { result } = renderHook(useHostIdentity);
    await waitFor(() => {
      expect(mocks.identity).toHaveBeenCalledOnce();
      expect(result.current).toEqual({
        hostPlayerName: name,
        hostDisplayName: name,
        userId: "owner",
        error: "",
        setError: expect.any(Function),
      });
    });
    expect(mocks.direct).not.toHaveBeenCalled();
  },
);
it("ignores identity resolved after unmount", async () => {
  let finish: (value: unknown) => void = () => {};
  mocks.identity.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const { result, unmount } = renderHook(useHostIdentity);
  unmount();
  await act(async () =>
    finish({ data: { user: { user_metadata: { display_name: "Late" } } } }),
  );
  expect(result.current.hostDisplayName).toBe("Host");
});
it.each(["returned", "rejected"])(
  "retains Host after %s identity failure and recovers on remount",
  async (mode) => {
    if (mode === "returned")
      mocks.identity.mockResolvedValueOnce({
        data: { user: null },
        error: { message: "Identity unavailable" },
      });
    else
      mocks.identity.mockRejectedValueOnce(new Error("Identity unavailable"));
    const first = renderHook(useHostIdentity);
    await act(async () => {});
    expect(first.result.current).toEqual({
      hostPlayerName: "Host",
      hostDisplayName: "Host",
      userId: null,
      error: "Couldn't verify the host account. Reload this page.",
      setError: expect.any(Function),
    });
    first.unmount();
    mocks.identity.mockResolvedValueOnce({
      data: {
        user: {
          id: "owner",
          user_metadata: { display_name: "Recovered host" },
        },
      },
      error: null,
    });
    const next = renderHook(useHostIdentity);
    await waitFor(() =>
      expect(next.result.current.hostDisplayName).toBe("Recovered host"),
    );
  },
);
it("handles a rejected identity read after unmount without publishing a name", async () => {
  let reject: (reason: Error) => void = () => {};
  mocks.identity.mockReturnValueOnce(
    new Promise((_resolve, fail) => {
      reject = fail;
    }),
  );
  const { result, unmount } = renderHook(useHostIdentity);
  unmount();
  await act(async () => {
    reject(new Error("Late identity failure"));
  });
  expect(result.current.hostDisplayName).toBe("Host");
});
