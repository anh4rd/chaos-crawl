import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, it, vi } from "vitest";
import PlayerRoster from "./PlayerRoster";

afterEach(cleanup);
function Roster({ pending }: { pending?: { finish: () => void } }) {
  const [players, setPlayers] = useState([
    { id: "pat", name: "Pat" },
    { id: "alex", name: "Alex" },
  ]);
  return (
    <>
      <PlayerRoster
        players={players.map((player) => ({
          ...player,
          initial: player.name.slice(0, 1),
          team: "",
          onRename: vi.fn(),
          onAssignTeam: vi.fn(),
          onRemove: () => {
            const remove = () =>
              setPlayers((current) =>
                current.filter((item) => item.id !== player.id),
              );
            if (pending) pending.finish = remove;
            else remove();
          },
        }))}
        teams={[]}
        draft=""
        creating={false}
        canCreate={false}
        onDraftChange={vi.fn()}
        onCreate={vi.fn()}
      />
      <button>Outside roster</button>
    </>
  );
}
it("keeps keyboard focus in the roster after removing the focused row and its final sibling", () => {
  render(<Roster />);
  const pat = screen.getByRole("button", { name: "Remove Pat" });
  pat.focus();
  fireEvent.click(pat);
  expect(document.activeElement).toBe(
    screen.getByRole("textbox", { name: "Rename Alex" }),
  );
  const alex = screen.getByRole("button", { name: "Remove Alex" });
  alex.focus();
  fireEvent.click(alex);
  expect(document.activeElement).toBe(
    screen.getByRole("textbox", { name: "New player name" }),
  );
});
it("does not move focus before removal settles or after the user leaves the roster", () => {
  const pending = { finish: () => {} };
  render(<Roster pending={pending} />);
  const remove = screen.getByRole("button", { name: "Remove Pat" });
  remove.focus();
  fireEvent.click(remove);
  expect(document.activeElement).toBe(remove);
  const outside = screen.getByRole("button", { name: "Outside roster" });
  outside.focus();
  act(pending.finish);
  expect(document.activeElement).toBe(outside);
});
it("returns focus only after a pending successful removal removes the active row", () => {
  const pending = { finish: () => {} };
  render(<Roster pending={pending} />);
  const remove = screen.getByRole("button", { name: "Remove Pat" });
  remove.focus();
  fireEvent.click(remove);
  expect(document.activeElement).toBe(remove);
  act(pending.finish);
  expect(document.activeElement).toBe(
    screen.getByRole("textbox", { name: "Rename Alex" }),
  );
});
