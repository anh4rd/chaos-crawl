import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("./supabase", () => ({ supabase: { from: mock.from } }));
import { revealScheduledChallenge } from "./gameApi";

const now = "2026-11-16T12:00:00.000Z";
const due = "2026-11-16T11:59:00.000Z";
const challenge = {
  id: 8,
  title: "Next challenge",
  description: "Do the thing",
  reveal_order: 3,
  pub_id: 1,
  points: 10,
  allow_photo_upload: true,
};
function query(response: unknown | Promise<unknown>) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    update: vi.fn(),
    abortSignal: vi.fn(),
    single: vi.fn(() => Promise.resolve(response)),
    maybeSingle: vi.fn(() => Promise.resolve(response)),
  };
  for (const method of ["select", "eq", "update", "abortSignal"] as const)
    builder[method].mockReturnValue(builder);
  mock.from.mockReturnValueOnce(builder);
  return builder;
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  vi.resetAllMocks();
});
afterEach(() => vi.useRealTimers());

it("reveals through a compare-and-set and clears schedule and screen flags", async () => {
  const signal = new AbortController().signal;
  const lookup = query({ data: challenge, error: null });
  const update = query({ data: { id: 1 }, error: null });
  expect(await revealScheduledChallenge(8, due, signal)).toEqual({
    data: { id: 1 },
    error: null,
  });
  expect(mock.from.mock.calls).toEqual([["challenges"], ["game_state"]]);
  expect(lookup.eq).toHaveBeenCalledWith("id", 8);
  expect(update.update).toHaveBeenCalledWith(
    expect.objectContaining({
      current_challenge_id: 8,
      current_challenge: "Next challenge",
      challenge_description: "Do the thing",
      current_challenge_order: 3,
      scheduled_challenge_id: null,
      scheduled_reveal_at: null,
      voting_open: false,
      show_vote_results: false,
      slideshow_open: false,
    }),
  );
  expect(update.eq.mock.calls).toEqual([
    ["id", 1],
    ["scheduled_challenge_id", 8],
    ["scheduled_reveal_at", due],
  ]);
  expect(update.abortSignal).toHaveBeenCalledWith(signal);
});
it("treats another client revealing or a changed/cancelled schedule as a successful no-op", async () => {
  query({ data: challenge, error: null });
  query({ data: null, error: null });
  expect(await revealScheduledChallenge(8, due)).toEqual({
    data: null,
    error: null,
  });
});
it("refuses future and invalid schedule input without accessing the client", async () => {
  expect(
    (await revealScheduledChallenge(8, "2026-11-16T12:01:00.000Z")).error?.code,
  ).toBe("INVALID_INPUT");
  expect((await revealScheduledChallenge(8, "bad-date")).error?.code).toBe(
    "INVALID_INPUT",
  );
  expect((await revealScheduledChallenge(NaN, due)).error?.code).toBe(
    "INVALID_INPUT",
  );
  expect(mock.from).not.toHaveBeenCalled();
});
it("does no work for an already cancelled request", async () => {
  const controller = new AbortController();
  controller.abort();
  expect(await revealScheduledChallenge(8, due, controller.signal)).toEqual({
    data: null,
    error: null,
  });
  expect(mock.from).not.toHaveBeenCalled();
});
it("does not mutate after cancellation while a fetch ignored its abort signal", async () => {
  let resolve!: (value: unknown) => void;
  query(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const controller = new AbortController();
  const pending = revealScheduledChallenge(8, due, controller.signal);
  controller.abort();
  resolve({ data: challenge, error: null });
  expect(await pending).toEqual({ data: null, error: null });
  expect(mock.from).toHaveBeenCalledOnce();
});
it("returns challenge lookup and conditional update failures for explicit retry", async () => {
  query({ data: null, error: { message: "Missing challenge" } });
  expect((await revealScheduledChallenge(8, due)).error?.message).toBe(
    "Missing challenge",
  );
  query({ data: challenge, error: null });
  query({ data: null, error: { message: "Update denied" } });
  expect((await revealScheduledChallenge(8, due)).error?.message).toBe(
    "Update denied",
  );
});
it("reports a deleted challenge rather than writing empty live fields", async () => {
  query({ data: null, error: null });
  expect((await revealScheduledChallenge(8, due)).error?.message).toContain(
    "no longer exists",
  );
  expect(mock.from).toHaveBeenCalledOnce();
});

it("cancels an older schedule when the host manually advances the game", async () => {
  const { updateGameState } = await import("./gameApi");
  const update = query({ data: null, error: null });
  Object.assign(update, {
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve({ data: null, error: null }).then(resolve),
  });
  await updateGameState({
    current_challenge_id: 9,
    current_challenge: "Manual challenge",
  });
  expect(update.update).toHaveBeenCalledWith(
    expect.objectContaining({
      scheduled_challenge_id: null,
      scheduled_reveal_at: null,
      current_challenge_id: 9,
    }),
  );
});
