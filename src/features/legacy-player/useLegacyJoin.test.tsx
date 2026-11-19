import { StrictMode } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ApiResult } from "../../lib/apiResult";
import type { Player } from "../../types/database";
import { createPlayer } from "../../lib/playerApi";
import { setPlayerId } from "../../lib/playerSession";
import LegacyJoinView from "./LegacyJoinView";
import { useLegacyJoin } from "./useLegacyJoin";

vi.mock("../../lib/playerApi", () => ({ createPlayer: vi.fn() }));
vi.mock("../../lib/playerSession", () => ({ setPlayerId: vi.fn() }));
const player: Player = {
  id: "created-player",
  name: "Nora",
  team: null,
  score: 0,
};
function deferred() {
  let finish: (result: ApiResult<Player>) => void = () => {
    throw new Error("Missing deferred resolver");
  };
  const promise = new Promise<ApiResult<Player>>((resolve) => {
    finish = resolve;
  });
  return { promise, finish };
}
function JoinHarness({ onJoined }: { onJoined: () => void }) {
  const join = useLegacyJoin(onJoined);
  return <LegacyJoinView {...join} />;
}
function startJoin(onJoined = vi.fn()) {
  const view = render(
    <StrictMode>
      <JoinHarness onJoined={onJoined} />
    </StrictMode>,
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Your name" }), {
    target: { value: " Nora " },
  });
  const button = screen.getByRole("button", { name: "Join Game" });
  const form = button.closest("form");
  if (!form) throw new Error("Missing join form");
  fireEvent.submit(form);
  return { ...view, form, onJoined };
}
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);

it("does not save or navigate for a creation that resolves after leaving join", async () => {
  const pending = deferred();
  vi.mocked(createPlayer).mockReturnValue(pending.promise);
  const view = startJoin();
  view.unmount();
  await act(async () => pending.finish({ data: player, error: null }));
  expect(setPlayerId).not.toHaveBeenCalled();
  expect(view.onJoined).not.toHaveBeenCalled();
});

it("an obsolete join cannot replace the credential saved by a newer join", async () => {
  const old = deferred();
  vi.mocked(createPlayer)
    .mockReturnValueOnce(old.promise)
    .mockResolvedValueOnce({
      data: { ...player, id: "newer-player" },
      error: null,
    });
  const previous = startJoin();
  previous.unmount();
  const current = startJoin();
  await act(async () => {});
  expect(setPlayerId).toHaveBeenCalledExactlyOnceWith("newer-player");
  await act(async () => old.finish({ data: player, error: null }));
  expect(setPlayerId).toHaveBeenCalledExactlyOnceWith("newer-player");
  expect(previous.onJoined).not.toHaveBeenCalled();
  expect(current.onJoined).toHaveBeenCalledOnce();
});

it("excludes repeated submits and retains the created identity when saving storage fails", async () => {
  const pending = deferred();
  vi.mocked(createPlayer).mockReturnValue(pending.promise);
  vi.mocked(setPlayerId).mockImplementationOnce(() => {
    throw new Error("Storage blocked");
  });
  const view = startJoin();
  fireEvent.submit(view.form);
  expect(createPlayer).toHaveBeenCalledExactlyOnceWith("Nora", null);
  await act(async () => pending.finish({ data: player, error: null }));
  expect(screen.getByRole("alert").textContent).toBe("Storage blocked");
  expect(
    screen.getByRole("textbox", { name: "Your name" }).hasAttribute("disabled"),
  ).toBe(true);
  await act(async () => fireEvent.submit(view.form));
  expect(createPlayer).toHaveBeenCalledOnce();
  expect(setPlayerId).toHaveBeenLastCalledWith("created-player");
  expect(view.onJoined).toHaveBeenCalledOnce();
});
