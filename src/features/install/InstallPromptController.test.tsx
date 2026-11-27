import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import InstallPromptController from "./InstallPromptController";

const requestPermission = vi.fn();

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  vi.stubGlobal("Notification", {
    permission: "default",
    requestPermission,
  });
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Android");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

it("offers browser installation and asks for notification permission only after a separate action", async () => {
  const prompt = vi.fn().mockResolvedValue(undefined);
  render(<InstallPromptController />);
  const event = new Event("beforeinstallprompt", { cancelable: true });
  Object.defineProperty(event, "prompt", { value: prompt });
  act(() => window.dispatchEvent(event));
  expect(event.defaultPrevented).toBe(true);
  expect(requestPermission).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Install app" }));
  expect(prompt).toHaveBeenCalledOnce();
  act(() => window.dispatchEvent(new Event("appinstalled")));
  expect(requestPermission).not.toHaveBeenCalled();
  requestPermission.mockResolvedValue("granted");
  fireEvent.click(screen.getByRole("button", { name: "Allow notifications" }));
  expect(requestPermission).toHaveBeenCalledOnce();
});

it("shows iOS instructions in a browser and requests permission only from the installed app", () => {
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue("iPhone");
  const browser = render(<InstallPromptController />);
  expect(screen.getByText(/Tap Share/)).toBeTruthy();
  expect(requestPermission).not.toHaveBeenCalled();
  browser.unmount();
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  render(<InstallPromptController />);
  expect(
    screen.getByRole("button", { name: "Allow notifications" }),
  ).toBeTruthy();
  expect(requestPermission).not.toHaveBeenCalled();
});

it("does not ask again when notification permission is already decided", () => {
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  vi.stubGlobal("Notification", {
    permission: "denied",
    requestPermission,
  });
  render(<InstallPromptController />);
  expect(
    screen.queryByRole("region", { name: "Install Chaos Crawl" }),
  ).toBeNull();
  expect(requestPermission).not.toHaveBeenCalled();
});

it("lets users dismiss installation guidance without invoking the browser prompt", () => {
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue("iPhone");
  render(<InstallPromptController />);
  fireEvent.click(screen.getByRole("button", { name: "Not now" }));
  expect(
    screen.queryByRole("region", { name: "Install Chaos Crawl" }),
  ).toBeNull();
  expect(requestPermission).not.toHaveBeenCalled();
});

it("offers Android menu instructions and respects dismissal if a native prompt arrives later", () => {
  render(<InstallPromptController />);
  expect(screen.getByText(/browser's menu/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Not now" }));
  const event = new Event("beforeinstallprompt", { cancelable: true });
  Object.defineProperty(event, "prompt", { value: vi.fn() });
  act(() => window.dispatchEvent(event));
  expect(
    screen.queryByRole("region", { name: "Install Chaos Crawl" }),
  ).toBeNull();
});

it("reports a failed permission request without offering a false success", async () => {
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  vi.spyOn(console, "error").mockImplementation(() => {});
  requestPermission.mockRejectedValue(new Error("Permission failed"));
  render(<InstallPromptController />);
  fireEvent.click(screen.getByRole("button", { name: "Allow notifications" }));
  expect(
    await screen.findByText(/Could not request notification permission/),
  ).toBeTruthy();
  expect(console.error).toHaveBeenCalled();
});
