import { beforeEach, expect, it, vi } from "vitest";
import {
  downloadSessionEvidence,
  prepareSessionEvidence,
  uploadSessionEvidence,
} from "./sessionEvidence";
const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  download: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock("./sessionSupabase", () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: mocks.upload,
        download: mocks.download,
      }),
    },
    rpc: mocks.rpc,
  },
}));
vi.mock("./monitoring", () => ({ reportError: vi.fn() }));
beforeEach(() => {
  mocks.upload.mockReset().mockResolvedValue({ error: null });
  mocks.download.mockReset().mockResolvedValue({
    data: new Blob(["image"]),
    error: null,
  });
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
it.each([null, "secret-assignment"])(
  "registers evidence for assignment %s with supplied participant credentials",
  async (assignmentId) => {
    const file = new File(["image"], "photo.png", { type: "image/png" });
    const result = await uploadSessionEvidence({
      file,
      sessionId: "session",
      playerId: "host-player",
      code: "123456",
      token: "host-token",
      challengeId: "challenge",
      assignmentId,
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
      p_secret_assignment_id: assignmentId,
      p_storage_path: result.data,
      p_media_type: "image",
    });
  },
);
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

it("downloads a participant's original evidence from the session bucket", async () => {
  const file = new Blob(["image"]);
  mocks.download.mockResolvedValueOnce({ data: file, error: null });
  const result = await downloadSessionEvidence("session/player/evidence.png");
  expect(result).toEqual({ data: file, error: null });
  expect(mocks.download).toHaveBeenCalledWith("session/player/evidence.png");
});

it.each([
  ["video/3gpp2", "3g2", "video/3gpp2"],
  ["video/3gpp", "3gp", "video/3gpp"],
  ["video/quicktime", "mov", "video/quicktime"],
  ["video/x-matroska", "mkv", "video/x-matroska"],
  ["video/x-msvideo", "avi", "video/x-msvideo"],
  ["video/x-ms-wmv", "wmv", "video/x-ms-wmv"],
  ["video/x-flv", "flv", "video/x-flv"],
  ["video/mp2t", "ts", "video/mp2t"],
  ["video/webm", "webm", "video/webm"],
  ["video/ogg", "ogv", "video/ogg"],
  ["video/x-m4v", "m4v", "video/x-m4v"],
  ["video/mpeg", "mpeg", "video/mpeg"],
  ["video/mp4", "mp4", "video/mp4"],
  ["video/x-ms-asf", "asf", "video/x-ms-asf"],
])(
  "preserves MIME format %s for an incompatible filename",
  (type, extension, contentType) => {
    expect(
      prepareSessionEvidence({ name: "photo.png", type, size: 1 }).data,
    ).toEqual({ mediaType: "video", extension, contentType });
  },
);
it("keeps mobile HEIC inference and the exact maximum evidence size", () => {
  expect(
    prepareSessionEvidence({
      name: "photo.HEIC",
      type: "",
      size: 100 * 1024 * 1024,
    }).data,
  ).toEqual({
    mediaType: "image",
    extension: "heic",
    contentType: "image/heic",
  });
});
