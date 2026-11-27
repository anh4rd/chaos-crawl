import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
import { FunctionsHttpError } from "@supabase/supabase-js";

const mocks = vi.hoisted(() => ({ invoke: vi.fn(), rpc: vi.fn() }));
vi.mock("../lib/sessionSupabase", () => ({
  supabase: { functions: { invoke: mocks.invoke }, rpc: mocks.rpc },
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
  mocks.rpc.mockReset();
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("resumes a valid cached player before requesting details", async () => {
  localStorage.setItem("chaos-crawl-session-player:123456", "cached-token");
  mocks.rpc.mockResolvedValue({
    data: { player: { name: "Pat" } },
    error: null,
  });
  openJoin();
  await waitFor(() =>
    expect(screen.getByLabelText("Location").textContent).toBe("/play/123456"),
  );
  expect(mocks.rpc).toHaveBeenCalledWith("cc_get_game_session_view", {
    p_join_code: "123456",
    p_player_token: "cached-token",
  });
  expect(mocks.invoke).not.toHaveBeenCalled();
  expect(localStorage.getItem("chaos-crawl-session-player:123456")).toBe(
    "cached-token",
  );
});

it("offers recovery if the cached token has expired", async () => {
  localStorage.setItem("chaos-crawl-session-player:123456", "expired-token");
  mocks.rpc.mockResolvedValue({
    data: null,
    error: {
      message:
        "Your player session expired. Rejoin with the same mobile number.",
    },
  });
  openJoin();
  expect(await screen.findByLabelText("Your phone number?")).toBeTruthy();
  expect(screen.getByLabelText("Location").textContent).toBe("/join");
  expect(mocks.invoke).not.toHaveBeenCalled();
});

it("does not mistake a failed session check for an expired token", async () => {
  localStorage.setItem("chaos-crawl-session-player:123456", "cached-token");
  mocks.rpc.mockResolvedValue({
    data: null,
    error: { message: "Database unavailable" },
  });
  openJoin();
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Couldn't check your saved session",
  );
  expect(screen.getByLabelText("Location").textContent).toBe("/join");
  expect(localStorage.getItem("chaos-crawl-session-player:123456")).toBe(
    "cached-token",
  );
});

it("reports an unavailable identity service rather than blaming the phone number", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.invoke.mockResolvedValue({
    data: null,
    error: new FunctionsHttpError(new Response(null, { status: 404 })),
  });
  openJoin();
  fillDetails();
  fireEvent.click(screen.getByRole("button", { name: /Join game/ }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Player access is temporarily unavailable",
  );
  expect(screen.getByLabelText("Location").textContent).toBe("/join");
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

it.each([
  {
    country: "44",
    number: "07123 456789",
    custom: "",
    expected: "+447123456789",
  },
  {
    country: "1",
    number: "202 555 0123",
    custom: "",
    expected: "+12025550123",
  },
  {
    country: "other",
    number: "82 123 4567",
    custom: "27",
    expected: "+27821234567",
  },
  {
    country: "44",
    number: "+1 202 555 0123",
    custom: "",
    expected: "+1 202 555 0123",
  },
  {
    country: "",
    number: "0044 7123 456789",
    custom: "",
    expected: "+44 7123 456789",
  },
  { country: "", number: "", custom: "", expected: "" },
])(
  "submits a new player with the selected calling code: $expected",
  async ({ country, number, custom, expected }) => {
    mocks.invoke.mockResolvedValue({
      data: {
        player_token: "token",
        join_code: "123456",
        player_name: "Pat",
        resumed: false,
      },
      error: null,
    });
    openJoin();
    fireEvent.change(screen.getByLabelText("Your name?"), {
      target: { value: "Pat" },
    });
    fireEvent.change(screen.getByLabelText("Country calling code"), {
      target: { value: country },
    });
    if (country === "other")
      fireEvent.change(screen.getByLabelText("Calling code digits"), {
        target: { value: custom },
      });
    fireEvent.change(screen.getByLabelText("Your phone number?"), {
      target: { value: number },
    });
    fireEvent.click(screen.getByRole("button", { name: /Join game/ }));
    await waitFor(() =>
      expect(mocks.invoke).toHaveBeenCalledWith(
        "player-identity",
        expect.objectContaining({
          body: expect.objectContaining({ mobile: expected }),
        }),
      ),
    );
  },
);

it("requires a valid custom calling code for a national number", () => {
  openJoin();
  fireEvent.change(screen.getByLabelText("Your name?"), {
    target: { value: "Pat" },
  });
  fireEvent.change(screen.getByLabelText("Country calling code"), {
    target: { value: "other" },
  });
  fireEvent.change(screen.getByLabelText("Your phone number?"), {
    target: { value: "821234567" },
  });
  expect(
    screen.getByRole("button", { name: /Join game/ }).hasAttribute("disabled"),
  ).toBe(true);
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
  fireEvent.click(
    screen.getByRole("button", { name: "Use recovery code instead" }),
  );
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

it("rejoins using a formatted phone number without a recovery code", async () => {
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
  fireEvent.change(screen.getByLabelText("Country calling code"), {
    target: { value: "44" },
  });
  fireEvent.change(screen.getByLabelText("Your phone number?"), {
    target: { value: "07123 456789" },
  });
  fireEvent.click(screen.getByRole("button", { name: /Rejoin game/ }));
  await waitFor(() =>
    expect(mocks.invoke).toHaveBeenCalledWith("player-identity", {
      body: {
        action: "recover_phone",
        join_code: "123456",
        mobile: "+447123456789",
      },
    }),
  );
  await waitFor(() =>
    expect(screen.getByLabelText("Location").textContent).toBe("/play/123456"),
  );
  expect(localStorage.getItem("chaos-crawl-session-player:123456")).toBe(
    "returning-token",
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
