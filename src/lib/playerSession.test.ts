import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { clearPlayerId, readPlayerSession, setPlayerId } from "./playerSession";
import { usePlayerSession } from "../game/hooks/usePlayerSession";

beforeEach(() => window.localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("distinguishes a missing ID from a persisted session and clears it explicitly", () => {
  expect(readPlayerSession()).toEqual({ status: "missing", playerId: null });
  setPlayerId("player");
  expect(readPlayerSession()).toEqual({ status: "ready", playerId: "player" });
  clearPlayerId();
  expect(readPlayerSession()).toEqual({ status: "missing", playerId: null });
});
it("returns an actionable unavailable result when getItem throws SecurityError", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new DOMException("Access denied", "SecurityError");
  });
  const result = readPlayerSession();
  expect(result.status).toBe("unavailable");
  if (result.status !== "unavailable")
    throw new Error("Expected storage failure");
  expect(result.error.message).toContain("Allow site storage");
  expect(result.playerId).toBeNull();
});
it("also handles an unavailable localStorage property getter", () => {
  vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
    throw new DOMException("Storage disabled", "SecurityError");
  });
  expect(readPlayerSession().status).toBe("unavailable");
});
it("retries blocked storage and reacts to local writes and cross-tab changes", async () => {
  const blocked = vi
    .spyOn(Storage.prototype, "getItem")
    .mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
  const { result } = renderHook(usePlayerSession);
  expect(result.current.status).toBe("unavailable");
  blocked.mockRestore();
  window.localStorage.setItem("chaos-crawl-player-id", "restored");
  await act(() => result.current.reload());
  expect(result.current.playerId).toBe("restored");
  expect(result.current.error).toBeNull();
  act(() => setPlayerId("new"));
  expect(result.current.playerId).toBe("new");
  window.localStorage.setItem("chaos-crawl-player-id", "another-tab");
  act(() =>
    window.dispatchEvent(
      new StorageEvent("storage", { key: "chaos-crawl-player-id" }),
    ),
  );
  expect(result.current.playerId).toBe("another-tab");
  act(clearPlayerId);
  expect(result.current.status).toBe("missing");
});
