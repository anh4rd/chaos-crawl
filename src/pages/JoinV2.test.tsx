import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";

const mocks = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("../lib/sessionSupabase", () => ({
  supabase: { functions: { invoke: mocks.invoke } },
}));
vi.mock("../features/player-access/recoveryVault", () => ({
  pendingRecoveryCredential: vi.fn(async () => "sample-recovery"),
  clearPendingRecovery: vi.fn(async () => {}),
}));
import Join from "./Join";

function Location() {
  const location = useLocation();
  return <output aria-label="Location">{location.pathname}</output>;
}
function openJoin(path = "/join?code=123456") {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Join />
      <Location />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole("button", { name: /Next/ }));
}
function fillDetails() {
  fireEvent.change(screen.getByLabelText("Your name?"), {
    target: { value: "Pat" },
  });
  fireEvent.change(screen.getByLabelText("Your phone number?"), {
    target: { value: "0821234567" },
  });
}
beforeEach(() => {
  mocks.invoke.mockReset();
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("joins a V2 session using its RPC and stores the session token without changing the legacy player", async () => {
  localStorage.setItem("chaos-crawl-player-id", "legacy-player");
  mocks.invoke.mockResolvedValue({
    data: {
      player_token: "session-token",
      join_code: "123456",
      player_name: "Pat",
      resumed: false,
    },
    error: null,
  });
  openJoin();
  fillDetails();
  fireEvent.click(screen.getByRole("button", { name: /Join game/ }));
  fireEvent.click(
    await screen.findByRole("button", { name: "Continue without saving" }),
  );
  await waitFor(() =>
    expect(screen.getByLabelText("Location").textContent).toBe("/play/123456"),
  );
  expect(mocks.invoke).toHaveBeenCalledWith("player-identity", {
    body: {
      action: "register",
      join_code: "123456",
      credential: "sample-recovery",
      name: "Pat",
      mobile: "0821234567",
    },
  });
  expect(localStorage.getItem("chaos-crawl-session-player:123456")).toBe(
    "session-token",
  );
  expect(localStorage.getItem("chaos-crawl-player-id")).toBe("legacy-player");
});

it("rejoins with a recovery credential without requiring a new name", async () => {
  mocks.invoke.mockResolvedValue({
    data: {
      player_token: "returning-token",
      join_code: "123456",
      player_name: "Pat",
      resumed: true,
    },
    error: null,
  });
  openJoin("/join?code=123456&returning=1");
  expect(screen.queryByLabelText("Your name?")).toBeNull();
  fireEvent.change(screen.getByLabelText("Recovery code"), {
    target: { value: "sample-recovery" },
  });
  fireEvent.click(screen.getByRole("button", { name: /Rejoin game/ }));
  await waitFor(() =>
    expect(mocks.invoke).toHaveBeenCalledWith("player-identity", {
      body: {
        action: "recover",
        join_code: "123456",
        credential: "sample-recovery",
      },
    }),
  );
  await waitFor(() =>
    expect(screen.getByLabelText("Location").textContent).toBe("/play/123456"),
  );
});

it("keeps the player on the join form when the session response is incomplete", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.invoke.mockResolvedValue({
    data: { join_code: "123456" },
    error: null,
  });
  openJoin();
  fillDetails();
  fireEvent.click(screen.getByRole("button", { name: /Join game/ }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Couldn't complete player access",
  );
  expect(screen.getByLabelText("Location").textContent).toBe("/join");
  expect(localStorage.getItem("chaos-crawl-session-player:123456")).toBeNull();
});
