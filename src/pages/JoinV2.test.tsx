import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("../lib/sessionSupabase", () => ({ supabase: { rpc: mocks.rpc } }));
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
  mocks.rpc.mockReset();
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("joins a V2 session using its RPC and stores the session token without changing the legacy player", async () => {
  localStorage.setItem("chaos-crawl-player-id", "legacy-player");
  mocks.rpc.mockResolvedValue({
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
  await waitFor(() =>
    expect(screen.getByLabelText("Location").textContent).toBe("/play/123456"),
  );
  expect(mocks.rpc).toHaveBeenCalledWith("cc_join_game_session", {
    p_join_code: "123456",
    p_name: "Pat",
    p_mobile: "0821234567",
  });
  expect(localStorage.getItem("chaos-crawl-session-player:123456")).toBe(
    "session-token",
  );
  expect(localStorage.getItem("chaos-crawl-player-id")).toBe("legacy-player");
});

it("rejoins with a code and mobile number without requiring a new name", async () => {
  mocks.rpc.mockResolvedValue({
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
  fireEvent.change(screen.getByLabelText("Your phone number?"), {
    target: { value: "0821234567" },
  });
  fireEvent.click(screen.getByRole("button", { name: /Rejoin game/ }));
  await waitFor(() =>
    expect(mocks.rpc).toHaveBeenCalledWith("cc_join_game_session", {
      p_join_code: "123456",
      p_name: null,
      p_mobile: "0821234567",
    }),
  );
  await waitFor(() =>
    expect(screen.getByLabelText("Location").textContent).toBe("/play/123456"),
  );
});

it("keeps the player on the join form when the session response is incomplete", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.rpc.mockResolvedValue({ data: { join_code: "123456" }, error: null });
  openJoin();
  fillDetails();
  fireEvent.click(screen.getByRole("button", { name: /Join game/ }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "didn't return a player session",
  );
  expect(screen.getByLabelText("Location").textContent).toBe("/join");
  expect(localStorage.getItem("chaos-crawl-session-player:123456")).toBeNull();
});
