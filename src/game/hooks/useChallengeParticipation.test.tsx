import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useChallengeParticipation } from "./useChallengeParticipation";
import { completeChallenge } from "../../lib/completionApi";
import { uploadMedia } from "../../lib/mediaApi";
import type { Player } from "../../types/database";
import type { ChangeEvent } from "react";
vi.mock("../../lib/completionApi", () => ({ completeChallenge: vi.fn() }));
vi.mock("../../lib/mediaApi", () => ({ uploadMedia: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
const player: Player = { id: "p", name: "Pat", team: null, score: 0 };
const challenge = { id: 1, title: "Dance", points: 10, type: "main" as const };
const uploaded = { data: { id: "media" }, error: null };
function inputEvent() {
  const input = document.createElement("input");
  input.type = "file";
  Object.defineProperty(input, "files", {
    value: [new File(["a"], "a.jpg", { type: "image/jpeg" })],
  });
  return { currentTarget: input } as ChangeEvent<HTMLInputElement>;
}
it("prevents duplicate immediate completions and keeps success optimistic", async () => {
  let finish!: (value: never) => void;
  vi.mocked(completeChallenge).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const { result } = renderHook(() =>
    useChallengeParticipation(player, "Pub", []),
  );
  let saving!: Promise<void>;
  act(() => {
    saving = result.current.complete("main", 1, 10);
    void result.current.complete("main", 1, 10);
  });
  expect(completeChallenge).toHaveBeenCalledOnce();
  expect(result.current.hasCompleted("main", 1)).toBe(true);
  await act(async () => {
    finish({ data: { id: 1 }, error: null } as never);
    await saving;
  });
  expect(result.current.completingKey).toBeNull();
  expect(result.current.hasCompleted("main", 1)).toBe(true);
});
it("rolls back failed completion so the player can retry", async () => {
  vi.mocked(completeChallenge).mockResolvedValue({
    data: null,
    error: { message: "offline" },
  });
  const { result } = renderHook(() =>
    useChallengeParticipation(player, "Pub", []),
  );
  await act(() => result.current.complete("main", 1, 10));
  expect(result.current.hasCompleted("main", 1)).toBe(false);
  expect(result.current.error?.message).toBe("offline");
  expect(result.current.completingKey).toBeNull();
});
it("treats an already completed response as completed", async () => {
  vi.mocked(completeChallenge).mockResolvedValue({
    data: null,
    error: { code: "ALREADY_COMPLETED", message: "already done" },
  });
  const { result } = renderHook(() =>
    useChallengeParticipation(player, "Pub", []),
  );
  await act(() => result.current.complete("main", 1, 10));
  expect(result.current.hasCompleted("main", 1)).toBe(true);
  expect(result.current.error).toBeNull();
});
it("cleans upload state when media throws and permits retry", async () => {
  vi.mocked(uploadMedia).mockRejectedValue(new Error("offline"));
  const { result } = renderHook(() =>
    useChallengeParticipation(player, "Pub", []),
  );
  act(() => result.current.chooseUpload(challenge));
  const event = inputEvent();
  await act(() => result.current.handleFileSelected(event));
  expect(result.current.uploadingKey).toBeNull();
  expect(result.current.error?.message).toBe("offline");
  expect(completeChallenge).not.toHaveBeenCalled();
});
it("keeps picker attribution when the host switches players or pubs", async () => {
  vi.mocked(uploadMedia).mockResolvedValue(uploaded as never);
  vi.mocked(completeChallenge).mockResolvedValue({
    data: { id: 1 },
    error: null,
  } as never);
  const { result, rerender } = renderHook(
    ({ actor, pub }) => useChallengeParticipation(actor, pub, []),
    { initialProps: { actor: player, pub: "Old Pub" } },
  );
  act(() => result.current.chooseUpload(challenge));
  rerender({
    actor: { ...player, id: "other", name: "Other" },
    pub: "New Pub",
  });
  await act(() => result.current.handleFileSelected(inputEvent()));
  expect(uploadMedia).toHaveBeenCalledWith(
    expect.any(File),
    expect.objectContaining({ playerId: "p", pub: "Old Pub" }),
  );
  expect(completeChallenge).toHaveBeenCalledWith(
    expect.objectContaining({ playerId: "p", photoId: "media" }),
  );
});
it("shows a completion failure after uploaded media and releases the operation lock", async () => {
  vi.mocked(uploadMedia).mockResolvedValue(uploaded as never);
  vi.mocked(completeChallenge).mockRejectedValue(
    new Error("completion offline"),
  );
  const { result } = renderHook(() =>
    useChallengeParticipation(player, "Pub", []),
  );
  act(() => result.current.chooseUpload(challenge));
  await act(() => result.current.handleFileSelected(inputEvent()));
  await waitFor(() => expect(result.current.uploadingKey).toBeNull());
  expect(result.current.hasCompleted("main", 1)).toBe(false);
  expect(result.current.error?.message).toContain(
    "Media uploaded, but challenge completion failed",
  );
});

it("starts optimistic completion only after the captured media upload succeeds", async () => {
  let uploaded!: (value: never) => void;
  let completed!: (value: never) => void;
  vi.mocked(uploadMedia).mockReturnValue(
    new Promise((resolve) => {
      uploaded = resolve;
    }),
  );
  vi.mocked(completeChallenge).mockReturnValue(
    new Promise((resolve) => {
      completed = resolve;
    }),
  );
  const { result } = renderHook(() =>
    useChallengeParticipation(player, "Pub", []),
  );
  act(() => result.current.chooseUpload(challenge));
  let saving!: Promise<void>;
  act(() => {
    saving = result.current.handleFileSelected(inputEvent());
  });
  expect(result.current.uploadingKey).not.toBeNull();
  expect(result.current.hasCompleted("main", 1)).toBe(false);
  expect(completeChallenge).not.toHaveBeenCalled();
  await act(async () =>
    uploaded({ data: { id: "media" }, error: null } as never),
  );
  expect(result.current.hasCompleted("main", 1)).toBe(true);
  expect(completeChallenge).toHaveBeenCalledWith(
    expect.objectContaining({ photoId: "media" }),
  );
  await act(async () => {
    completed({ data: null, error: { message: "completion failed" } } as never);
    await saving;
  });
  expect(result.current.hasCompleted("main", 1)).toBe(false);
  expect(result.current.error?.message).toContain(
    "Media uploaded, but challenge completion failed: completion failed",
  );
});

it("does not create a completion when upload reports failure or no media record", async () => {
  const { result } = renderHook(() =>
    useChallengeParticipation(player, "Pub", []),
  );
  for (const response of [
    { data: null, error: { message: "storage failed" } },
    { data: null, error: null },
  ]) {
    vi.mocked(uploadMedia).mockResolvedValueOnce(response);
    act(() => result.current.chooseUpload(challenge));
    await act(() => result.current.handleFileSelected(inputEvent()));
    expect(result.current.hasCompleted("main", 1)).toBe(false);
    expect(result.current.uploadingKey).toBeNull();
    expect(result.current.error).not.toBeNull();
  }
  expect(completeChallenge).not.toHaveBeenCalled();
});
