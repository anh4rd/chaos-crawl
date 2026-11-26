import {
  fireEvent,
  render,
  screen,
  waitFor,
  cleanup,
  act,
} from "@testing-library/react";
import { useState } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import HostAccess from "./HostAccess";
const { getSession, signInWithPassword, signUp } = vi.hoisted(() => ({
  getSession: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
}));
vi.mock("../../lib/supabase", () => ({
  supabase: { auth: { getSession, signInWithPassword, signUp } },
}));
beforeEach(() => {
  vi.resetAllMocks();
  getSession.mockResolvedValue({ data: { session: null }, error: null });
});
afterEach(cleanup);
function open() {
  return render(
    <MemoryRouter initialEntries={["/host/login"]}>
      <Routes>
        <Route path="/host/login" element={<HostAccess />} />
        <Route path="/host" element={<h1>Host hub destination</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}
function fill() {
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "host@example.test" },
  });
  fireEvent.change(screen.getByLabelText(/^Password/), {
    target: { value: "secret-pass" },
  });
}
it("preserves password login payloads and redirects on success", async () => {
  signInWithPassword.mockResolvedValue({ error: null });
  open();
  fill();
  fireEvent.click(screen.getByRole("button", { name: "Log in to Host Hub" }));
  await screen.findByRole("heading", { name: "Host hub destination" });
  expect(signInWithPassword).toHaveBeenCalledWith({
    email: "host@example.test",
    password: "secret-pass",
  });
  expect(signUp).not.toHaveBeenCalled();
});
it("shows failed-login feedback and clears it when switching account actions", async () => {
  signInWithPassword.mockResolvedValue({
    error: { message: "Wrong credentials" },
  });
  open();
  fill();
  fireEvent.click(screen.getByRole("button", { name: "Log in to Host Hub" }));
  await screen.findByRole("alert");
  expect(screen.getByRole("alert").textContent).toBe("Wrong credentials");
  expect(
    screen.getByRole("button", { name: "Log in to Host Hub" }),
  ).toHaveProperty("disabled", false);
  fireEvent.click(screen.getByRole("tab", { name: "Create account" }));
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByLabelText("Your name")).toBeTruthy();
});
it("preserves signup metadata and the confirmation notice without navigating", async () => {
  signUp.mockResolvedValue({ data: { session: null }, error: null });
  open();
  fireEvent.click(screen.getByRole("tab", { name: "Create account" }));
  fill();
  fireEvent.change(screen.getByLabelText("Your name"), {
    target: { value: "  Alex Chaos  " },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create host account" }));
  await screen.findByRole("status");
  expect(screen.getByRole("status").textContent).toContain("Check your email");
  expect(signUp).toHaveBeenCalledWith({
    email: "host@example.test",
    password: "secret-pass",
    options: {
      data: { display_name: "Alex Chaos" },
      emailRedirectTo: new URL(
        `${import.meta.env.BASE_URL}?host_confirmation=1`,
        window.location.origin,
      ).href,
    },
  });
  expect(
    screen.queryByRole("heading", { name: "Host hub destination" }),
  ).toBeNull();
});
it("redirects a signup that returns a session", async () => {
  signUp.mockResolvedValue({
    data: { session: { access_token: "test" } },
    error: null,
  });
  open();
  fireEvent.click(screen.getByRole("tab", { name: "Create account" }));
  fill();
  fireEvent.change(screen.getByLabelText("Your name"), {
    target: { value: "Alex" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create host account" }));
  await screen.findByRole("heading", { name: "Host hub destination" });
});
it("redirects an existing session", async () => {
  getSession.mockResolvedValueOnce({
    data: { session: { access_token: "test" } },
    error: null,
  });
  open();
  await screen.findByRole("heading", { name: "Host hub destination" });
});
function ClosableAccess() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setOpen(false)}>
        Close authentication
      </button>
      {open ? <HostAccess /> : <p>Authentication closed</p>}
    </>
  );
}
it("does not redirect the mounted router when an obsolete session check resolves", async () => {
  let finish: (value: unknown) => void = () => {};
  getSession.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  render(
    <MemoryRouter initialEntries={["/host/login"]}>
      <Routes>
        <Route path="/host/login" element={<ClosableAccess />} />
        <Route path="/host" element={<h1>Host hub destination</h1>} />
      </Routes>
    </MemoryRouter>,
  );
  await waitFor(() => expect(getSession).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole("button", { name: "Close authentication" }));
  await act(async () => {
    finish({ data: { session: { access_token: "late" } }, error: null });
  });
  expect(screen.getByText("Authentication closed")).toBeTruthy();
  expect(
    screen.queryByRole("heading", { name: "Host hub destination" }),
  ).toBeNull();
});
