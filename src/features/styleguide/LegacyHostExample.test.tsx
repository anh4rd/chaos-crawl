import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import LegacyHostExample from "./LegacyHostExample";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("keeps local roster, score and live actions inside the preview", () => {
  const fetch = vi.spyOn(globalThis, "fetch");
  const stored = { ...localStorage };
  render(<LegacyHostExample />);
  const navigation = screen.getByRole("navigation", {
    name: "Host navigation",
  });
  fireEvent.click(within(navigation).getByRole("button", { name: "Players" }));
  fireEvent.change(screen.getByRole("textbox", { name: "New team name" }), {
    target: { value: "  Bears  " },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create team" }));
  expect(screen.getByRole("combobox", { name: "Team" }).textContent).toContain(
    "Bears",
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Rename Pat" }), {
    target: { value: "Patricia" },
  });
  fireEvent.blur(screen.getByRole("textbox", { name: "Rename Pat" }));
  expect(screen.getByRole("textbox", { name: "Rename Patricia" })).toBeTruthy();
  fireEvent.click(within(navigation).getByRole("button", { name: "Scores" }));
  fireEvent.change(screen.getByRole("spinbutton", { name: "Points" }), {
    target: { value: "3" },
  });
  fireEvent.click(screen.getByRole("button", { name: /Award points/ }));
  expect(screen.getByRole("status").textContent).toBe(
    "Points changed locally.",
  );
  fireEvent.click(
    within(navigation).getByRole("button", { name: "Challenges" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Review" }));
  expect(screen.getByRole("status").textContent).toBe("Review opened locally.");
  fireEvent.click(within(navigation).getByRole("button", { name: "Live" }));
  fireEvent.click(screen.getByRole("button", { name: "Open voting" }));
  expect(
    screen.getByRole("button", { name: "Close voting & show results" }),
  ).toBeTruthy();
  expect(fetch).not.toHaveBeenCalled();
  expect({ ...localStorage }).toEqual(stored);
  expect(document.querySelectorAll("main")).toHaveLength(0);
});

it("demonstrates pending editable fields and empty content without writes", () => {
  const fetch = vi.spyOn(globalThis, "fetch");
  render(<LegacyHostExample />);
  fireEvent.click(screen.getByRole("checkbox", { name: "Pending controls" }));
  const navigation = screen.getByRole("navigation", {
    name: "Host navigation",
  });
  fireEvent.click(within(navigation).getByRole("button", { name: "Players" }));
  const field = screen.getByRole("textbox", { name: "New player name" });
  fireEvent.change(field, { target: { value: "Kai" } });
  expect(field.getAttribute("disabled")).toBeNull();
  expect(
    screen.getByRole("button", { name: "Add player" }).hasAttribute("disabled"),
  ).toBe(true);
  fireEvent.click(screen.getByRole("checkbox", { name: "Empty content" }));
  expect(
    screen.getByText(
      "Players will appear here when they join using your game code.",
    ),
  ).toBeTruthy();
  fireEvent.click(within(navigation).getByRole("button", { name: "Scores" }));
  expect(
    screen.getByText("Scores will appear here when points are awarded."),
  ).toBeTruthy();
  expect(fetch).not.toHaveBeenCalled();
});
