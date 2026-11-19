import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, it } from "vitest";
import HostAccessForm from "./HostAccessForm";
import type { AuthMode } from "./types";

afterEach(cleanup);
function Access() {
  const [mode, changeMode] = useState<AuthMode>("login");
  return (
    <HostAccessForm
      auth={{
        mode,
        changeMode,
        name: "",
        email: "",
        password: "",
        busy: false,
        error: "",
        notice: "",
        setName: () => {},
        setEmail: () => {},
        setPassword: () => {},
        submit: async (event) => {
          event.preventDefault();
        },
      }}
    />
  );
}
it("exposes one tabbable account action and its named panel while retaining the native form", () => {
  render(<Access />);
  const login = screen.getByRole("tab", { name: "Log in" });
  const signup = screen.getByRole("tab", { name: "Create account" });
  expect(login.tabIndex).toBe(0);
  expect(signup.tabIndex).toBe(-1);
  const panel = screen.getByRole("tabpanel", { name: "Log in" });
  expect(login.getAttribute("aria-controls")).toBe(panel.id);
  expect(signup.getAttribute("aria-controls")).toBe(panel.id);
  expect(panel.getAttribute("aria-labelledby")).toBe(login.id);
  expect(panel.querySelector("form")).not.toBeNull();
  expect(
    within(panel).getByRole("textbox", { name: "Email address" }),
  ).toBeDefined();
});
it("automatically selects and focuses account actions with arrows, Home and End", () => {
  render(<Access />);
  const login = screen.getByRole("tab", { name: "Log in" });
  const signup = screen.getByRole("tab", { name: "Create account" });
  login.focus();
  fireEvent.keyDown(login, { key: "ArrowRight" });
  expect(document.activeElement).toBe(signup);
  expect(signup.getAttribute("aria-selected")).toBe("true");
  expect(signup.tabIndex).toBe(0);
  expect(login.tabIndex).toBe(-1);
  const panel = screen.getByRole("tabpanel", { name: "Create account" });
  expect(panel.getAttribute("aria-labelledby")).toBe(signup.id);
  expect(
    within(panel).getByRole("textbox", { name: "Your name" }),
  ).toBeDefined();
  fireEvent.keyDown(signup, { key: "ArrowRight" });
  expect(document.activeElement).toBe(login);
  fireEvent.keyDown(login, { key: "End" });
  expect(document.activeElement).toBe(signup);
  fireEvent.keyDown(signup, { key: "Home" });
  expect(document.activeElement).toBe(login);
  expect(screen.queryByRole("textbox", { name: "Your name" })).toBeNull();
});
