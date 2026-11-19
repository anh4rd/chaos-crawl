import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import LegacyAdminExample from "./LegacyAdminExample";
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("keeps roster, pending recovery, participation and screen navigation local", () => {
  const fetch = vi.spyOn(globalThis, "fetch");
  const credentials = { ...localStorage };
  render(<LegacyAdminExample />);
  fireEvent.click(screen.getByRole("button", { name: "👥 Players" }));
  fireEvent.click(screen.getByRole("button", { name: "+5" }));
  expect(screen.getByText("Score: 15")).toBeTruthy();
  const input = screen.getByRole("textbox", { name: "Name for Robin" });
  fireEvent.change(input, { target: { value: "  Robyn  " } });
  const form = input.closest("form");
  if (!form) throw new Error("Missing native name form");
  fireEvent.submit(form);
  expect(
    screen.getByRole("textbox", { name: "Name for Robyn" }),
  ).toHaveProperty("value", "Robyn");
  fireEvent.click(
    screen.getByRole("checkbox", { name: "Preview pending operation" }),
  );
  expect(screen.getByRole("button", { name: "+5" })).toHaveProperty(
    "disabled",
    true,
  );
  fireEvent.click(
    screen.getByRole("checkbox", { name: "Preview pending operation" }),
  );
  fireEvent.click(
    screen.getByRole("checkbox", { name: "Preview query error" }),
  );
  expect(screen.getByRole("alert").textContent).toBe("Preview query failed");
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(screen.queryByRole("alert")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "🏁 Teams" }));
  fireEvent.change(screen.getByPlaceholderText("Team name..."), {
    target: { value: "  Bears  " },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create Team" }));
  fireEvent.change(screen.getByRole("combobox", { name: "Team for Robyn" }), {
    target: { value: "Bears" },
  });
  expect(
    screen.getByRole("combobox", { name: "Team for Robyn" }),
  ).toHaveProperty("value", "Bears");
  fireEvent.click(screen.getByRole("button", { name: "🎯 Challenges" }));
  fireEvent.change(screen.getByRole("combobox", { name: "Play as player" }), {
    target: { value: "sample-player" },
  });
  fireEvent.click(screen.getByRole("button", { name: "✓ Mark Done" }));
  expect(screen.getByText("✓ Completed")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "📺 Screens" }));
  fireEvent.click(screen.getByRole("button", { name: "Leaderboard" }));
  expect(screen.getByRole("status").textContent).toBe(
    "Preview navigation: /leaderboard",
  );
  expect(fetch).not.toHaveBeenCalled();
  expect({ ...localStorage }).toEqual(credentials);
});
