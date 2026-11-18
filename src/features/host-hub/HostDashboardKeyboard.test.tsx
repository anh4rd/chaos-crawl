import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import HostDashboard from "./HostDashboard";

vi.mock("../host-workspace/HostWorkspace", () => ({
  default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("./useHostHub", () => ({
  useHostHub: () => ({
    games: [],
    upcoming: [],
    past: [],
    dashboardGame: null,
    isPlatformAdmin: false,
    hostDirectory: [],
    viewingHost: null,
    loading: false,
    error: null,
    playingId: null,
    editGame: vi.fn(),
    playGame: vi.fn(),
  }),
}));
afterEach(cleanup);

function Dashboard() {
  const location = useLocation();
  return (
    <>
      <output aria-label="Current route">
        {location.pathname + location.search}
      </output>
      <HostDashboard
        view={location.pathname === "/host/games" ? "games" : "home"}
        viewAsHostId={new URLSearchParams(location.search).get("viewAs")}
        created={false}
      />
    </>
  );
}

it("links the selected Hub tab to the existing games section with one tab stop", () => {
  render(
    <MemoryRouter initialEntries={["/host"]}>
      <Dashboard />
    </MemoryRouter>,
  );
  const overview = screen.getByRole("tab", { name: "Overview" });
  const games = screen.getByRole("tab", { name: /Your games/ });
  expect(overview.tabIndex).toBe(0);
  expect(games.tabIndex).toBe(-1);
  const panel = screen.getByRole("tabpanel", { name: "Overview" });
  expect(overview.getAttribute("aria-controls")).toBe(panel.id);
  expect(games.getAttribute("aria-controls")).toBe(panel.id);
  expect(panel.getAttribute("aria-labelledby")).toBe(overview.id);
  expect(panel.tagName).toBe("SECTION");
  expect(
    within(panel).getByRole("heading", { name: "Upcoming games" }),
  ).toBeDefined();
});

it("moves selection and focus with arrows, Home and End while preserving preview routes", () => {
  render(
    <MemoryRouter initialEntries={["/host?viewAs=another-host"]}>
      <Dashboard />
    </MemoryRouter>,
  );
  const overview = screen.getByRole("tab", { name: "Overview" });
  const games = screen.getByRole("tab", { name: /Your games/ });
  overview.focus();
  fireEvent.keyDown(overview, { key: "ArrowRight" });
  expect(document.activeElement).toBe(games);
  expect(screen.getByLabelText("Current route").textContent).toBe(
    "/host/games?viewAs=another-host",
  );
  expect(games.getAttribute("aria-selected")).toBe("true");
  expect(games.tabIndex).toBe(0);
  expect(overview.tabIndex).toBe(-1);
  expect(
    within(screen.getByRole("tabpanel", { name: /Your games/ })).getByRole(
      "heading",
      { name: "All plans" },
    ),
  ).toBeDefined();
  fireEvent.keyDown(games, { key: "ArrowRight" });
  expect(document.activeElement).toBe(overview);
  fireEvent.keyDown(overview, { key: "End" });
  expect(document.activeElement).toBe(games);
  fireEvent.keyDown(games, { key: "Home" });
  expect(document.activeElement).toBe(overview);
  fireEvent.keyDown(overview, { key: "ArrowLeft" });
  expect(document.activeElement).toBe(games);
});
