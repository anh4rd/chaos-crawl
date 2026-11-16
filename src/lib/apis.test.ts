import type { ApiResult } from "./apiResult";
import type {
  Player,
  Vote,
  GameState,
  ChallengeCompletion,
  ScoreEvent,
  Media,
} from "../types/database";
import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  publicUrl: vi.fn(),
  compress: vi.fn(),
}));
vi.mock("./supabase", () => ({
  supabase: {
    from: mocks.from,
    storage: {
      from: () => ({
        upload: mocks.upload,
        remove: mocks.remove,
        getPublicUrl: mocks.publicUrl,
      }),
    },
  },
}));
vi.mock("browser-image-compression", () => ({ default: mocks.compress }));

import { completeChallenge, getChallengeCompletions } from "./completionApi";
import { uploadMedia } from "./mediaApi";
import {
  addPoints,
  removePoints,
  renamePlayer,
  createPlayer,
  changeTeam,
} from "./playerApi";
import { awardScore } from "./scoreApi";
import {
  submitVote,
  castVote,
  getMyVote,
  getVotesForChallenge,
} from "./voteApi";
import { getGameState } from "./gameApi";

function query(result: unknown, rejection?: Error) {
  const response = () =>
    rejection ? Promise.reject(rejection) : Promise.resolve(result);
  const builder = {
    select: vi.fn(),
    abortSignal: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    single: vi.fn(response),
    maybeSingle: vi.fn(response),
    then: (
      resolve: (value: unknown) => unknown,
      reject: (error: unknown) => unknown,
    ) => response().then(resolve, reject),
  };
  for (const key of [
    "select",
    "abortSignal",
    "insert",
    "update",
    "delete",
    "eq",
    "order",
  ] as const)
    builder[key].mockReturnValue(builder);
  mocks.from.mockReturnValueOnce(builder);
  return builder;
}
const completion = {
  id: "completion",
  player_id: "player",
  challenge_type: "main",
  challenge_id: "1",
  points: 5,
  photo_id: null,
  completed_at: "2026-01-01",
};
const completionArgs = {
  playerId: "player",
  challengeType: "main" as const,
  challengeId: 1,
  points: 5,
};
const mediaDetails = {
  playerId: "player",
  playerName: "Player",
  team: null,
  challenge: "Challenge",
  pub: "Pub",
};
const failure = { code: "XX000", message: "Database unavailable" };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.upload.mockResolvedValue({ data: { path: "uploaded" }, error: null });
  mocks.remove.mockResolvedValue({ data: [], error: null });
  mocks.publicUrl.mockReturnValue({
    data: { publicUrl: "https://example.invalid/media" },
  });
  mocks.compress.mockImplementation(async (file: File) => file);
});

describe("completion outcomes", () => {
  it("returns an existing completion without a second insert", async () => {
    const check = query({ data: completion, error: null });
    expect(await completeChallenge(completionArgs)).toEqual({
      data: completion,
      error: expect.objectContaining({ code: "ALREADY_COMPLETED" }),
    });
    expect(check.insert).not.toHaveBeenCalled();
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });
  it("stops after a failed duplicate check", async () => {
    query({ data: null, error: failure });
    expect(await completeChallenge(completionArgs)).toEqual({
      data: null,
      error: failure,
    });
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });
  it("inserts normalized challenge IDs and returns the row", async () => {
    query({ data: null, error: null });
    const insert = query({ data: completion, error: null });
    expect(await completeChallenge(completionArgs)).toEqual({
      data: completion,
      error: null,
    });
    expect(insert.insert).toHaveBeenCalledWith(
      expect.objectContaining({ challenge_id: "1", photo_id: null }),
    );
  });
  it("maps a uniqueness race only when the matching completion now exists", async () => {
    query({ data: null, error: null });
    query({
      data: null,
      error: { code: "23505", message: "Unique violation" },
    });
    query({ data: completion, error: null });
    expect((await completeChallenge(completionArgs)).error?.code).toBe(
      "ALREADY_COMPLETED",
    );
  });
  it("preserves unrelated uniqueness errors", async () => {
    query({ data: null, error: null });
    query({ data: null, error: { code: "23505", message: "Photo conflict" } });
    query({ data: null, error: null });
    expect((await completeChallenge(completionArgs)).error?.message).toBe(
      "Photo conflict",
    );
  });
  it("returns insert failures and thrown check failures", async () => {
    query({ data: null, error: null });
    query({ data: null, error: failure });
    expect((await completeChallenge(completionArgs)).error).toEqual(failure);
    query(null, new Error("Offline"));
    expect((await completeChallenge(completionArgs)).error?.message).toBe(
      "Offline",
    );
  });
  it("uses null data on list failure instead of a misleading empty list", async () => {
    query({ data: [], error: failure });
    expect(await getChallengeCompletions()).toEqual({
      data: null,
      error: failure,
    });
  });
});

describe("media uploads", () => {
  it("rejects unsupported media and oversized videos before side effects", async () => {
    expect(
      (
        await uploadMedia(
          new File(["x"], "x.txt", { type: "text/plain" }),
          mediaDetails,
        )
      ).error?.code,
    ).toBe("INVALID_INPUT");
    const video = new File([], "x.mp4", { type: "video/mp4" });
    Object.defineProperty(video, "size", { value: 101 * 1024 * 1024 });
    expect((await uploadMedia(video, mediaDetails)).error?.message).toContain(
      "100MB",
    );
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it("uses compressed output MIME and extension rather than the original filename", async () => {
    const compressed = new File(["compressed"], "output.webp", {
      type: "image/webp",
    });
    mocks.compress.mockResolvedValue(compressed);
    query({ data: { id: "photo" }, error: null });
    expect(
      (
        await uploadMedia(
          new File(["raw"], "wrong.jpg", { type: "image/jpeg" }),
          mediaDetails,
        )
      ).error,
    ).toBeNull();
    expect(mocks.upload).toHaveBeenCalledWith(
      expect.stringMatching(/\.webp$/),
      compressed,
      expect.objectContaining({ contentType: "image/webp" }),
    );
  });
  it("returns compression failure before uploading", async () => {
    mocks.compress.mockRejectedValue(new Error("Compression failed"));
    expect(
      (
        await uploadMedia(
          new File(["x"], "x.png", { type: "image/png" }),
          mediaDetails,
        )
      ).error?.message,
    ).toBe("Compression failed");
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it("returns storage failures without inserting or removing an unconfirmed upload", async () => {
    mocks.upload.mockResolvedValue({ data: null, error: failure });
    expect(
      (
        await uploadMedia(
          new File(["x"], "x.mp4", { type: "video/mp4" }),
          mediaDetails,
        )
      ).error,
    ).toEqual(failure);
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it.each([false, true])(
    "removes uploaded storage when row insertion fails (throws=%s)",
    async (throws) => {
      query(
        { data: null, error: failure },
        throws ? new Error("Insert threw") : undefined,
      );
      const result = await uploadMedia(
        new File(["x"], "x.mp4", { type: "video/mp4" }),
        mediaDetails,
      );
      expect(result.error?.message).toBe(
        throws ? "Insert threw" : failure.message,
      );
      expect(mocks.remove).toHaveBeenCalledWith([
        expect.stringMatching(/^player\/.*\.mp4$/),
      ]);
    },
  );
  it("compensates when public URL derivation throws after storage succeeds", async () => {
    mocks.publicUrl.mockImplementation(() => {
      throw new Error("URL failed");
    });
    const result = await uploadMedia(
      new File(["x"], "x.mp4", { type: "video/mp4" }),
      mediaDetails,
    );
    expect(result.error?.message).toBe("URL failed");
    expect(mocks.remove).toHaveBeenCalledOnce();
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("returns thrown storage failure without attempting to remove an unconfirmed upload", async () => {
    mocks.upload.mockRejectedValue(new Error("Storage offline"));
    const result = await uploadMedia(
      new File(["x"], "x.mp4", { type: "video/mp4" }),
      mediaDetails,
    );
    expect(result.error?.message).toBe("Storage offline");
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("cleans up when the database returns no inserted record", async () => {
    query({ data: null, error: null });
    const result = await uploadMedia(
      new File(["x"], "x.mp4", { type: "video/mp4" }),
      mediaDetails,
    );
    expect(result.error?.message).toContain("not returned");
    expect(mocks.remove).toHaveBeenCalledOnce();
  });
  it("reports cleanup failure alongside the original insertion error", async () => {
    query({ data: null, error: failure });
    mocks.remove.mockRejectedValue(new Error("Cleanup offline"));
    const result = await uploadMedia(
      new File(["x"], "x.mp4", { type: "video/mp4" }),
      mediaDetails,
    );
    expect(result.error?.message).toContain(failure.message);
    expect(result.error?.message).toContain("Cleanup offline");
  });
});

describe("score adjustments", () => {
  it("concurrent additions append independent events without replacing a score snapshot", async () => {
    const first = query({ data: { id: "a" }, error: null });
    const second = query({ data: { id: "b" }, error: null });
    const results = await Promise.all([
      addPoints("player", 5),
      addPoints("player", 10),
    ]);
    expect(results.every((result) => !result.error)).toBe(true);
    expect(mocks.from.mock.calls).toEqual([["score_events"], ["score_events"]]);
    expect(first.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        player_id: "player",
        points: 5,
        challenge_type: "manual",
      }),
    );
    expect(second.insert).toHaveBeenCalledWith(
      expect.objectContaining({ points: 10 }),
    );
    expect(first.update).not.toHaveBeenCalled();
    expect(first.insert.mock.calls[0][0].challenge_id).not.toBe(
      second.insert.mock.calls[0][0].challenge_id,
    );
  });
  it("caps a single deduction using event total and appends the negative delta", async () => {
    query({ data: [{ points: 10 }, { points: -3 }], error: null });
    const insert = query({ data: { id: "deduction" }, error: null });
    expect((await removePoints("player", 20)).error).toBeNull();
    expect(insert.insert).toHaveBeenCalledWith(
      expect.objectContaining({ points: -7 }),
    );
  });
  it("exposes that concurrent deductions use a snapshot floor, while preserving both events", async () => {
    query({ data: [{ points: 10 }], error: null });
    query({ data: [{ points: 10 }], error: null });
    const first = query({ data: { id: "a" }, error: null });
    const second = query({ data: { id: "b" }, error: null });
    await Promise.all([removePoints("player", 8), removePoints("player", 8)]);
    expect(first.insert).toHaveBeenCalledWith(
      expect.objectContaining({ points: -8 }),
    );
    expect(second.insert).toHaveBeenCalledWith(
      expect.objectContaining({ points: -8 }),
    );
  });
  it("does not append after a failed aggregate read and reports failed writes", async () => {
    query({ data: null, error: failure });
    expect((await removePoints("player", 3)).error).toEqual(failure);
    query(null, new Error("Write offline"));
    expect((await addPoints("player", 3)).error?.message).toBe("Write offline");
  });
  it("rejects invalid amounts and ambiguous score recipients", async () => {
    expect((await addPoints("player", NaN)).error?.code).toBe("INVALID_INPUT");
    expect((await removePoints("player", -2)).error?.code).toBe(
      "INVALID_INPUT",
    );
    expect(
      (
        await awardScore({
          playerId: "p",
          teamName: "t",
          challengeId: "x",
          challengeType: "manual",
          challengeTitle: "Manual",
          points: 1,
        })
      ).error?.code,
    ).toBe("INVALID_INPUT");
    expect(mocks.from).not.toHaveBeenCalled();
  });
});

describe("vote and API error contracts", () => {
  it.each([{}, { playerId: "p", teamId: "t" }, { playerId: " " }])(
    "rejects an invalid target %o",
    async (target) => {
      expect((await submitVote("voter", "challenge", target)).error?.code).toBe(
        "INVALID_INPUT",
      );
      expect(mocks.from).not.toHaveBeenCalled();
    },
  );
  it("submits exactly one normalized vote target and preserves error codes", async () => {
    const insert = query({
      data: null,
      error: { code: "23505", message: "Already voted" },
    });
    expect(
      (await submitVote("voter", "challenge", { playerId: " p " })).error?.code,
    ).toBe("23505");
    expect(insert.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        voted_for_player_id: "p",
        voted_for_team_id: null,
      }),
    );
  });
  it("normalizes thrown failures from read and mutation helpers", async () => {
    mocks.from.mockImplementationOnce(() => {
      throw new Error("Missing configuration");
    });
    expect((await getGameState()).error?.message).toBe("Missing configuration");
    query(null, new Error("Rename failed"));
    expect((await renamePlayer("p", "Name")).error?.message).toBe(
      "Rename failed",
    );
  });
});

describe("player membership", () => {
  it("creates a named player without requiring a team", async () => {
    const insert = query({
      data: { id: "p", name: "Name", team: null },
      error: null,
    });
    expect((await createPlayer(" Name ")).error).toBeNull();
    expect(insert.insert).toHaveBeenCalledWith({
      name: "Name",
      team: null,
      score: 0,
    });
  });
  it("supports explicitly null teams and rejects empty player names", async () => {
    query({ data: { id: "p" }, error: null });
    expect((await createPlayer("Name", null)).error).toBeNull();
    expect((await createPlayer("  ")).error?.code).toBe("INVALID_INPUT");
  });
  it("unassigns a team using the existing empty selection", async () => {
    const update = query({ data: null, error: null });
    expect((await changeTeam("p", "")).error).toBeNull();
    expect(update.update).toHaveBeenCalledWith({ team: null });
  });
});

it("preserves public row and list result contracts at compile time", () => {
  expectTypeOf<ReturnType<typeof createPlayer>>().toEqualTypeOf<
    Promise<ApiResult<Player>>
  >();
  expectTypeOf<ReturnType<typeof getMyVote>>().toEqualTypeOf<
    Promise<ApiResult<Vote>>
  >();
  expectTypeOf<ReturnType<typeof getVotesForChallenge>>().toEqualTypeOf<
    Promise<ApiResult<Vote[]>>
  >();
  expectTypeOf<ReturnType<typeof getGameState>>().toEqualTypeOf<
    Promise<ApiResult<GameState>>
  >();
  expectTypeOf<ReturnType<typeof completeChallenge>>().toEqualTypeOf<
    Promise<ApiResult<ChallengeCompletion>>
  >();
  expectTypeOf<ReturnType<typeof getChallengeCompletions>>().toEqualTypeOf<
    Promise<ApiResult<ChallengeCompletion[]>>
  >();
  expectTypeOf<ReturnType<typeof awardScore>>().toEqualTypeOf<
    Promise<ApiResult<ScoreEvent>>
  >();
  expectTypeOf<ReturnType<typeof addPoints>>().toEqualTypeOf<
    Promise<ApiResult<ScoreEvent>>
  >();
  expectTypeOf<ReturnType<typeof removePoints>>().toEqualTypeOf<
    Promise<ApiResult<ScoreEvent>>
  >();
  expectTypeOf<ReturnType<typeof uploadMedia>>().toEqualTypeOf<
    Promise<ApiResult<Media>>
  >();
});

it("rejects compressed output that changes media category before storage side effects", async () => {
  mocks.compress.mockResolvedValue(
    new File(["x"], "changed.mp4", { type: "video/mp4" }),
  );
  const result = await uploadMedia(
    new File(["x"], "original.jpg", { type: "image/jpeg" }),
    mediaDetails,
  );
  expect(result.error?.code).toBe("INVALID_INPUT");
  expect(result.error?.message).toContain("processed media format");
  expect(mocks.upload).not.toHaveBeenCalled();
  expect(mocks.remove).not.toHaveBeenCalled();
});

it("validates upload attribution before compression or storage", async () => {
  const result = await uploadMedia(
    new File(["x"], "a.jpg", { type: "image/jpeg" }),
    { ...mediaDetails, playerId: " " },
  );
  expect(result.error?.code).toBe("INVALID_INPUT");
  expect(mocks.compress).not.toHaveBeenCalled();
  expect(mocks.upload).not.toHaveBeenCalled();
});

describe("verified ballot submission", () => {
  it("does not insert when the voter is confirmed missing", async () => {
    query({ data: null, error: null });
    expect(await castVote("voter", "Round", { playerId: "target" })).toEqual({
      data: { status: "voter-missing" },
      error: null,
    });
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });
  it("treats a duplicate vote as an already completed ballot", async () => {
    query({ data: { id: "voter" }, error: null });
    query({ data: null, error: { code: "23505", message: "already voted" } });
    expect(
      (await castVote("voter", "Round", { teamId: "team" })).data?.status,
    ).toBe("voted");
  });
  it("rechecks voter existence after a foreign-key failure and preserves a valid session", async () => {
    query({ data: { id: "voter" }, error: null });
    query({ data: null, error: { code: "23503", message: "target removed" } });
    query({ data: { id: "voter" }, error: null });
    const result = await castVote("voter", "Round", { playerId: "target" });
    expect(result.data).toBeNull();
    expect(result.error?.code).toBe("VOTE_TARGET_UNAVAILABLE");
    expect(result.error?.message).toContain("Choose again");
    expect(mocks.from.mock.calls).toEqual([
      ["players"],
      ["votes"],
      ["players"],
    ]);
  });
  it("reports a voter removed between existence check and insertion", async () => {
    query({ data: { id: "voter" }, error: null });
    query({ data: null, error: { code: "23503", message: "voter removed" } });
    query({ data: null, error: null });
    expect(
      (await castVote("voter", "Round", { playerId: "target" })).data?.status,
    ).toBe("voter-missing");
  });
  it("does not mistake a failed voter recheck for a missing session", async () => {
    query({ data: { id: "voter" }, error: null });
    query({ data: null, error: { code: "23503", message: "foreign key" } });
    query(null, new Error("offline"));
    const result = await castVote("voter", "Round", { playerId: "target" });
    expect(result.data).toBeNull();
    expect(result.error?.message).toContain(
      "Could not verify your player session: offline",
    );
  });
  it("normalizes client initialization errors without treating them as a missing voter", async () => {
    mocks.from.mockImplementationOnce(() => {
      throw new Error("Missing configuration");
    });
    const result = await castVote("voter", "Round", { playerId: "target" });
    expect(result.data).toBeNull();
    expect(result.error?.message).toContain("Missing configuration");
  });
  it("does not insert after a stale voter lookup ignores its aborted signal", async () => {
    let finish!: (value: unknown) => void;
    query(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const controller = new AbortController();
    const saving = castVote(
      "voter",
      "Round",
      { playerId: "target" },
      controller.signal,
    );
    controller.abort();
    finish({ data: { id: "voter" }, error: null });
    expect((await saving).data?.status).toBe("cancelled");
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });
});
