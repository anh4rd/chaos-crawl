import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { hostSessionFixture } from "./testFixtures";
import { useHostSecretMissions } from "./useHostSecretMissions";

const commands = vi.hoisted(() => ({ insertSecretChallenge: vi.fn() }));
vi.mock("../../lib/hostSecretCommands", () => commands);
afterEach(cleanup);

it("creates custom missions with the current game-wide points", async () => {
  commands.insertSecretChallenge.mockResolvedValue({
    data: { id: "mission" },
    error: null,
  });
  const hook = renderHook(() =>
    useHostSecretMissions({
      session: hostSessionFixture({ secret_mission_points: 23 }),
      setBusy: () => true,
      setError: vi.fn(),
      setNotice: vi.fn(),
      challenges: [],
      load: async () => {},
      players: [],
    }),
  );
  act(() => hook.result.current.setNewSecretTitle("Custom mission"));
  let pending: Promise<void> | undefined;
  const view = render(
    <form
      aria-label="Create mission"
      onSubmit={(event) => {
        pending = hook.result.current.createSecretChallenge(event);
      }}
    />,
  );
  await act(async () => {
    fireEvent.submit(view.getByRole("form", { name: "Create mission" }));
    await pending;
  });
  expect(commands.insertSecretChallenge).toHaveBeenCalledWith(
    expect.objectContaining({ points: 23, kind: "secret" }),
  );
});
