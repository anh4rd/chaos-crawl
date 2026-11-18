import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useHostIdentity } from "./useHostIdentity";
const mocks = vi.hoisted(() => ({
  identity: vi.fn(),
  signOut: vi.fn(),
  navigate: vi.fn(),
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("../../lib/hostAuth", () => ({
  readHostIdentity: mocks.identity,
  signOutHost: mocks.signOut,
}));
beforeEach(() => {
  vi.resetAllMocks();
  mocks.identity.mockResolvedValue({ data: { user: null }, error: null });
  mocks.signOut.mockResolvedValue({ error: null });
});
afterEach(cleanup);
it("locks duplicate sign-outs synchronously and ignores a late success after unmount", async () => {
  let finish: (value: { error: null }) => void = () => {};
  mocks.signOut.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const { result, unmount } = renderHook(() => useHostIdentity());
  let first: Promise<void> = Promise.resolve();
  act(() => {
    first = result.current.signOut();
    void result.current.signOut();
  });
  expect(mocks.signOut).toHaveBeenCalledTimes(1);
  unmount();
  await act(async () => {
    finish({ error: null });
    await first;
  });
  expect(mocks.navigate).not.toHaveBeenCalled();
});
it("handles rejected identity recovery with feedback and retains the fallback identity", async () => {
  mocks.identity.mockRejectedValueOnce(new Error("Offline"));
  const { result } = renderHook(() => useHostIdentity());
  await waitFor(() => expect(result.current.error).toContain("identity"));
  expect(result.current.displayName).toBe("Host");
  act(() => result.current.dismissError());
  expect(result.current.error).toBe("");
});
