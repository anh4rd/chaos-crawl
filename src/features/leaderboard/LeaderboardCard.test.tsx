import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { LeaderboardCard } from "./LeaderboardCard";

const entry = { id: "Ducks team", name: "Ducks", score: 0, events: [] };
afterEach(cleanup);

it("renders an uploaded portrait alongside the candidate name", () => {
  render(
    <LeaderboardCard
      entry={{ ...entry, avatarUrl: "/team.jpg" }}
      index={0}
      expanded={false}
      onToggle={() => {}}
    />,
  );
  expect(
    screen
      .getByRole("button", { name: /Ducks/ })
      .querySelector("img")
      ?.getAttribute("src"),
  ).toBe("/team.jpg");
});

it("announces history expansion and links only the mounted history without losing focus", () => {
  const onToggle = vi.fn();
  const view = render(
    <LeaderboardCard
      entry={entry}
      index={0}
      expanded={false}
      onToggle={onToggle}
    />,
  );
  const toggle = screen.getByRole("button", { name: /Ducks/ });
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  expect(toggle.hasAttribute("aria-controls")).toBe(false);
  toggle.focus();
  fireEvent.click(toggle);
  expect(onToggle).toHaveBeenCalledOnce();
  view.rerender(
    <LeaderboardCard entry={entry} index={0} expanded onToggle={onToggle} />,
  );
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  const historyId = toggle.getAttribute("aria-controls");
  if (!historyId)
    throw new Error("Expanded history needs its control relationship");
  expect(document.getElementById(historyId)?.textContent).toContain(
    "No points awarded yet.",
  );
  expect(document.activeElement).toBe(toggle);
  view.rerender(
    <LeaderboardCard
      entry={entry}
      index={0}
      expanded={false}
      onToggle={onToggle}
    />,
  );
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  expect(toggle.hasAttribute("aria-controls")).toBe(false);
  expect(document.getElementById(historyId)).toBeNull();
  expect(document.activeElement).toBe(toggle);
});

it("gives distinct history targets to cards independently of domain names and IDs", () => {
  render(
    <>
      <LeaderboardCard entry={entry} index={0} expanded onToggle={() => {}} />
      <LeaderboardCard
        entry={{ ...entry, id: "Foxes team", name: "Foxes" }}
        index={1}
        expanded
        onToggle={() => {}}
      />
    </>,
  );
  const targets = screen
    .getAllByRole("button")
    .map((button) => button.getAttribute("aria-controls"));
  expect(targets.every(Boolean)).toBe(true);
  expect(new Set(targets).size).toBe(2);
  for (const target of targets) {
    if (!target) throw new Error("Missing history target");
    expect(target).not.toMatch(/\s/);
    expect(document.getElementById(target)).not.toBeNull();
  }
});
