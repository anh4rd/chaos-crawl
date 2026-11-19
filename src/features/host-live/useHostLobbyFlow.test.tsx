import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useHostLobbyFlow } from "./useHostLobbyFlow";
beforeEach(() => {
  localStorage.clear();
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it.each(["2.5", "0", "7", "NaN", "Infinity", "", "-1"])(
  "recovers invalid saved step %s to the first usable step",
  (value) => {
    localStorage.setItem("chaos-crawl-host-flow:session", value);
    const { result } = renderHook(() =>
      useHostLobbyFlow({ sessionId: "session" }),
    );
    expect(result.current.lobbyStep).toBe(1);
  },
);
it.each([1, 2, 3, 4, 5, 6] as const)("restores supported step %s", (step) => {
  localStorage.setItem("chaos-crawl-host-flow:session", String(step));
  const { result } = renderHook(() =>
    useHostLobbyFlow({ sessionId: "session" }),
  );
  expect(result.current.lobbyStep).toBe(step);
});
it("persists native navigation in the session key and scrolls", () => {
  const { result } = renderHook(() =>
    useHostLobbyFlow({ sessionId: "session" }),
  );
  act(() => result.current.goToLobbyStep(4));
  expect(result.current.lobbyStep).toBe(4);
  expect(localStorage.getItem("chaos-crawl-host-flow:session")).toBe("4");
  expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
});
