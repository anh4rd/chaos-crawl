import { beforeEach, expect, it, vi } from "vitest";
import {
  prepareSessionEvidence,
  uploadSessionEvidence,
} from "./sessionEvidence";
const mocks = vi.hoisted(() => ({ upload: vi.fn(), rpc: vi.fn() }));
vi.mock("./sessionSupabase", () => ({
  supabase: {
    storage: { from: () => ({ upload: mocks.upload }) },
    rpc: mocks.rpc,
  },
}));
vi.mock("./monitoring", () => ({ reportError: vi.fn() }));
beforeEach(() => {
  mocks.upload.mockReset().mockResolvedValue({ error: null });
  mocks.rpc.mockReset().mockResolvedValue({ data: null, error: null });
});
it("accepts a mobile MOV without a MIME type and keeps video extensions compatible", () => {
  expect(
    prepareSessionEvidence({ name: "clip.MOV", type: "", size: 5 }).data,
  ).toEqual({
    mediaType: "video",
    extension: "mov",
    contentType: "video/quicktime",
  });
  expect(
    prepareSessionEvidence({ name: "photo.mp4", type: "image/png", size: 5 })
      .data,
  ).toEqual({ mediaType: "image", extension: "png", contentType: "image/png" });
});
it("rejects empty, oversized and unsupported uploads before persistence", () => {
  expect(
    prepareSessionEvidence({ name: "photo.png", type: "image/png", size: 0 })
      .error?.message,
  ).toContain("empty");
  expect(
    prepareSessionEvidence({
      name: "clip.mp4",
      type: "video/mp4",
      size: 101 * 1024 * 1024,
    }).error?.message,
  ).toContain("100 MB");
  expect(
    prepareSessionEvidence({ name: "script.html", type: "text/html", size: 5 })
      .error?.message,
  ).toContain("supported");
  expect(mocks.upload).not.toHaveBeenCalled();
});
it("registers uploaded evidence with the supplied participant credential and identifiers", async () => {
  const file = new File(["image"], "photo.png", { type: "image/png" });
  const result = await uploadSessionEvidence({
    file,
    sessionId: "session",
    playerId: "host-player",
    code: "123456",
    token: "host-token",
    challengeId: "challenge",
    assignmentId: null,
    metadata: {
      mediaType: "image",
      extension: "png",
      contentType: "image/png",
    },
  });
  expect(result.error).toBeNull();
  expect(mocks.upload.mock.calls[0][0]).toMatch(
    /^session\/host-player\/.+\.png$/,
  );
  expect(mocks.rpc).toHaveBeenCalledWith("cc_player_add_session_evidence", {
    p_join_code: "123456",
    p_player_token: "host-token",
    p_challenge_id: "challenge",
    p_secret_assignment_id: null,
    p_storage_path: result.data,
    p_media_type: "image",
  });
});
it("does not register failed storage writes and preserves partial-upload errors", async () => {
  const args = {
    file: new File(["image"], "photo.png"),
    sessionId: "session",
    playerId: "player",
    code: "123456",
    token: "token",
    challengeId: "challenge",
    assignmentId: null,
    metadata: {
      mediaType: "image" as const,
      extension: "png",
      contentType: "image/png",
    },
  };
  mocks.upload.mockResolvedValueOnce({ error: { message: "offline" } });
  expect((await uploadSessionEvidence(args)).error?.message).toContain(
    "Upload failed: offline",
  );
  expect(mocks.rpc).not.toHaveBeenCalled();
  mocks.rpc.mockResolvedValueOnce({
    error: { message: "registration failed" },
  });
  expect((await uploadSessionEvidence(args)).error?.message).toContain(
    "file uploaded but couldn't be attached",
  );
});
