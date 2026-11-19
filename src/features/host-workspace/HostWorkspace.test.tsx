import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import HostWorkspace from "./HostWorkspace";
import HostShell from "../../components/host/HostShell";
const { getUser, signOut } = vi.hoisted(() => ({
  getUser: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("../../lib/supabase", () => ({
  supabase: { auth: { getUser, signOut } },
}));
beforeEach(() => {
  vi.resetAllMocks();
  getUser.mockResolvedValue({
    data: {
      user: {
        email: "host@example.test",
        user_metadata: { display_name: "Alex Chaos" },
      },
    },
    error: null,
  });
  signOut.mockResolvedValue({ error: null });
});
afterEach(cleanup);
it("keeps the shared shell presentation-only and delegates its actions", () => {
  const onCreate = vi.fn(),
    onSignOut = vi.fn();
  render(
    <MemoryRouter>
      <HostShell
        displayName="Demo Host"
        homeHref="/host"
        title="Workspace"
        onCreate={onCreate}
        onSignOut={onSignOut}
      >
        <p>Local content</p>
      </HostShell>
    </MemoryRouter>,
  );
  expect(getUser).not.toHaveBeenCalled();
  expect(screen.getByText("Demo Host")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Create new game" }));
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  expect(onCreate).toHaveBeenCalledTimes(1);
  expect(onSignOut).toHaveBeenCalledTimes(1);
});
it("resolves identity and signs out through the existing SDK before redirecting", async () => {
  render(
    <MemoryRouter initialEntries={["/host"]}>
      <Routes>
        <Route
          path="/host"
          element={
            <HostWorkspace title="Workspace">
              <p>Content</p>
            </HostWorkspace>
          }
        />
        <Route path="/host/login" element={<h1>Login destination</h1>} />
      </Routes>
    </MemoryRouter>,
  );
  await screen.findByText("Alex Chaos");
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  await screen.findByRole("heading", { name: "Login destination" });
  expect(signOut).toHaveBeenCalledTimes(1);
});
it("preserves read-only preview identity and its encoded home link", async () => {
  render(
    <MemoryRouter>
      <HostWorkspace
        previewUser={{
          id: "host/2",
          displayName: "Preview Host",
          email: "preview@example.test",
        }}
        readOnlyPreview
        showCreate={false}
      >
        <p>Preview content</p>
      </HostWorkspace>
    </MemoryRouter>,
  );
  expect(screen.getByText("Preview Host")).toBeTruthy();
  expect(screen.getByText("PREVIEW")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
  expect(
    screen.queryByRole("navigation", { name: "Host navigation" }),
  ).toBeNull();
  expect(
    screen.getByRole("link", { name: "CHAOSCRAWL" }).getAttribute("href"),
  ).toBe("/host?viewAs=host%2F2");
  await act(async () => {});
});
it.each(["returned", "rejected"])(
  "keeps the workspace after a %s sign-out failure and allows retry",
  async (failure) => {
    if (failure === "returned")
      signOut.mockResolvedValueOnce({
        error: { message: "Sign-out unavailable" },
      });
    else signOut.mockRejectedValueOnce(new Error("Sign-out unavailable"));
    render(
      <MemoryRouter initialEntries={["/host"]}>
        <Routes>
          <Route
            path="/host"
            element={
              <HostWorkspace title="Workspace">
                <p>Content</p>
              </HostWorkspace>
            }
          />
          <Route path="/host/login" element={<h1>Login destination</h1>} />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByText("Alex Chaos");
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await screen.findByRole("alert");
    expect(
      screen.queryByRole("heading", { name: "Login destination" }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await screen.findByRole("heading", { name: "Login destination" });
    expect(signOut).toHaveBeenCalledTimes(2);
  },
);
