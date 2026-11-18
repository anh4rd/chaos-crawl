import type { PropsWithChildren } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import SuperAdmin from "./SuperAdmin";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("../lib/sessionSupabase", () => ({ supabase: { rpc } }));
vi.mock("../features/host-workspace/HostWorkspace", () => ({
  default: ({ children }: PropsWithChildren) => <main>{children}</main>,
}));
// jsdom does not implement native modal dialogs; browser cases verify modality.
vi.mock("../components/ui/useModalDialog", async () => {
  const { useRef, useLayoutEffect } = await import("react");
  return {
    useModalDialog: () => {
      const ref = useRef<HTMLDialogElement>(null);
      useLayoutEffect(() => {
        ref.current?.setAttribute("open", "");
      }, []);
      return ref;
    },
  };
});
const games = [
  {
    game_id: "planned",
    name: "Garden chaos",
    host_email: "anna@example.test",
    status: "planned",
    event_date: "2030-01-01",
    created_at: "2029-12-01",
    player_count: 7,
    session_count: 2,
    live_sessions: 1,
  },
  {
    game_id: "live",
    name: "Night crawl",
    host_email: null,
    status: "live",
    event_date: null,
    created_at: "2029-12-02",
    player_count: 0,
    session_count: 0,
    live_sessions: 0,
  },
  {
    game_id: "completed",
    name: "Finished party",
    host_email: "pat@example.test",
    status: "completed",
    event_date: null,
    created_at: "2029-12-03",
    player_count: 5,
    session_count: 1,
    live_sessions: 0,
  },
];
const detail = {
  game: { name: "Garden chaos", host_email: "anna@example.test" },
  sessions: [
    {
      id: "session-one",
      name: "Friday session",
      join_code: "123456",
      status: "live",
      created_at: "2030-01-01",
      players: [
        { name: "Alex", score: 0, team_name: "Lime" },
        { name: "Sam", score: -2, team_name: null },
      ],
    },
  ],
};
function renderPage() {
  render(
    <MemoryRouter>
      <SuperAdmin />
    </MemoryRouter>,
  );
}
beforeEach(() => {
  vi.resetAllMocks();
  rpc.mockImplementation((name: string) =>
    Promise.resolve({
      data: name === "cc_super_admin_list_games" ? games : detail,
      error: null,
    }),
  );
});
afterEach(cleanup);

it("retains incoming game order, full-collection statistics and case-insensitive local filters", async () => {
  renderPage();
  await screen.findByText("Garden chaos");
  expect(rpc).toHaveBeenCalledExactlyOnceWith("cc_super_admin_list_games");
  expect(
    screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => within(row).getAllByRole("cell")[0]?.textContent),
  ).toEqual(["Garden chaos", "Night crawl", "Finished party"]);
  const stats = document.querySelector(".sa-stats");
  expect(stats?.textContent).toBe(
    "3Total games12Players across sessions2Live games",
  );
  fireEvent.change(screen.getByPlaceholderText("Search game or host email"), {
    target: { value: "ANNA@" },
  });
  expect(screen.getAllByRole("row")).toHaveLength(2);
  expect(screen.queryByText("Night crawl")).toBeNull();
  expect(stats?.textContent).toBe(
    "3Total games12Players across sessions2Live games",
  );
  fireEvent.change(screen.getByPlaceholderText("Search game or host email"), {
    target: { value: "" },
  });
  fireEvent.change(screen.getByRole("combobox"), {
    target: { value: "completed" },
  });
  expect(screen.getByText("Finished party")).toBeTruthy();
  expect(screen.queryByText("Garden chaos")).toBeNull();
  fireEvent.change(screen.getByPlaceholderText("Search game or host email"), {
    target: { value: "missing" },
  });
  expect(screen.getByText("No games match this search.")).toBeTruthy();
  expect(
    screen.getByRole("link", { name: "Back to Host Hub" }).getAttribute("href"),
  ).toBe("/host");
});

it.each(["Not authorised", "Not authorized"])(
  "shows %s denial and clears it after a successful refresh",
  async (message) => {
    rpc.mockResolvedValueOnce({ data: null, error: { message } });
    renderPage();
    await screen.findByText(message);
    expect(screen.getByText(/isn't provisioned as a Super Admin/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await screen.findByText("Garden chaos");
    expect(screen.queryByText(message)).toBeNull();
    expect(screen.queryByText(/isn't provisioned as a Super Admin/)).toBeNull();
    expect(rpc.mock.calls).toEqual([
      ["cc_super_admin_list_games"],
      ["cc_super_admin_list_games"],
    ]);
  },
);

it("loads inspector details with the selected id and preserves sessions, teams and zero/negative scores", async () => {
  renderPage();
  await screen.findByText("Garden chaos");
  fireEvent.click(screen.getAllByRole("button", { name: "Inspect" })[0]);
  const dialog = await screen.findByRole("dialog", { name: "Game inspector" });
  await within(dialog).findByRole("heading", { name: "Garden chaos" });
  expect(rpc).toHaveBeenLastCalledWith("cc_super_admin_game_detail", {
    p_game_id: "planned",
  });
  expect(within(dialog).getByText("Friday session")).toBeTruthy();
  expect(within(dialog).getByText("live · Code 123456")).toBeTruthy();
  expect(within(dialog).getByText("Alex · Lime")).toBeTruthy();
  expect(within(dialog).getByText("0 pts")).toBeTruthy();
  expect(within(dialog).getByText("-2 pts")).toBeTruthy();
  fireEvent.click(
    within(dialog).getByRole("button", {
      name: "Close game inspector",
    }),
  );
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("renders inspector loading before a pending detail reply and keeps existing fallback copy", async () => {
  let resolve: (value: {
    data: { game: Record<string, unknown>; sessions: [] };
    error: null;
  }) => void = () => {
    throw new Error("Pending request not initialized");
  };
  const pending = new Promise<{
    data: { game: Record<string, unknown>; sessions: [] };
    error: null;
  }>((complete) => {
    resolve = complete;
  });
  rpc.mockImplementation((name: string) =>
    name === "cc_super_admin_list_games"
      ? Promise.resolve({ data: games, error: null })
      : pending,
  );
  renderPage();
  await screen.findByText("Garden chaos");
  fireEvent.click(screen.getAllByRole("button", { name: "Inspect" })[0]);
  expect(screen.getByText("Loading game details…")).toBeTruthy();
  await act(async () => {
    resolve({ data: { game: {}, sessions: [] }, error: null });
    await pending;
  });
  const dialog = screen.getByRole("dialog", { name: "Game inspector" });
  expect(within(dialog).getByRole("heading", { name: "Game" })).toBeTruthy();
  expect(within(dialog).getByText("Host: Unknown")).toBeTruthy();
});

it("keeps detail errors inside the inspector and permits a current-id retry", async () => {
  rpc.mockImplementation((name: string) =>
    Promise.resolve({
      data: name === "cc_super_admin_list_games" ? games : null,
      error:
        name === "cc_super_admin_game_detail"
          ? { message: "Inspector unavailable" }
          : null,
    }),
  );
  renderPage();
  await screen.findByText("Garden chaos");
  fireEvent.click(screen.getAllByRole("button", { name: "Inspect" })[0]);
  await screen.findByText("Inspector unavailable");
  const dialog = screen.getByRole("dialog", { name: "Game inspector" });
  expect(within(dialog).getByRole("alert").textContent).toBe(
    "Inspector unavailable",
  );
  rpc.mockResolvedValueOnce({ data: detail, error: null });
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Retry inspection" }),
  );
  await within(dialog).findByRole("heading", { name: "Garden chaos" });
  expect(screen.queryByText("Inspector unavailable")).toBeNull();
});

it("a new inspection clears earlier list feedback while retaining the loaded collection", async () => {
  renderPage();
  await screen.findByText("Garden chaos");
  rpc.mockResolvedValueOnce({
    data: null,
    error: { message: "List unavailable" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
  await screen.findByText("List unavailable");
  rpc.mockResolvedValueOnce({ data: detail, error: null });
  fireEvent.click(screen.getAllByRole("button", { name: "Inspect" })[0]);
  const dialog = screen.getByRole("dialog", { name: "Game inspector" });
  await within(dialog).findByRole("heading", { name: "Garden chaos" });
  expect(screen.queryByText("List unavailable")).toBeNull();
  expect(screen.getAllByRole("row")).toHaveLength(4);
});
