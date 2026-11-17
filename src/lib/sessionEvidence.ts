import { runApi, type ApiResult } from "./apiResult";
import { supabase } from "./sessionSupabase";

export function prepareSessionEvidence(
  file: Pick<File, "name" | "size" | "type">,
): ApiResult<{
  mediaType: "image" | "video";
  extension: string;
  contentType: string;
}> {
  // Some browsers (notably on mobile) leave File.type blank for HEIC/MOV and other media.
  // Infer the type from the extension as a fallback so valid photos/videos are not rejected.
  const extFromName = file.name.includes(".")
    ? (file.name.split(".").pop()?.toLowerCase() ?? "")
    : "";
  const imageExtensions = new Set([
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "avif",
    "heic",
    "heif",
    "bmp",
    "tif",
    "tiff",
  ]);
  const videoExtensions = new Set([
    "mp4",
    "mov",
    "qt",
    "webm",
    "ogg",
    "ogv",
    "3gp",
    "3g2",
    "m4v",
    "mpeg",
    "mpg",
    "mp2",
    "avi",
    "mkv",
    "wmv",
    "flv",
    "ts",
    "mts",
    "m2ts",
    "asf",
  ]);
  const mime = (file.type || "").toLowerCase();
  const mediaType = mime.startsWith("video/")
    ? "video"
    : mime.startsWith("image/")
      ? "image"
      : videoExtensions.has(extFromName)
        ? "video"
        : imageExtensions.has(extFromName)
          ? "image"
          : null;
  if (!mediaType) {
    return {
      data: null,
      error: {
        message:
          "Choose a supported image or video (JPG, PNG, HEIC, MP4, MOV, WebM, and similar formats).",
      },
    };
  }
  const maxBytes = 100 * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      data: null,
      error: {
        message:
          "Files must be 100 MB or smaller. Try a shorter or compressed video.",
      },
    };
  }
  if (file.size === 0) {
    return {
      data: null,
      error: { message: "That file is empty. Choose another photo or video." },
    };
  }

  const allowedExtensions = new Set([
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "avif",
    "heic",
    "heif",
    "bmp",
    "tif",
    "tiff",
    "mp4",
    "mov",
    "qt",
    "webm",
    "ogg",
    "ogv",
    "3gp",
    "3g2",
    "m4v",
    "mpeg",
    "mpg",
    "mp2",
    "avi",
    "mkv",
    "wmv",
    "flv",
    "ts",
    "mts",
    "m2ts",
    "asf",
  ]);
  const mimeExtension = mime.includes("quicktime")
    ? "mov"
    : mime.includes("matroska")
      ? "mkv"
      : mime.includes("msvideo")
        ? "avi"
        : mime.includes("ms-wmv")
          ? "wmv"
          : mime.includes("x-flv")
            ? "flv"
            : mime.includes("mp2t")
              ? "ts"
              : mime.includes("webm")
                ? "webm"
                : mime.includes("ogg")
                  ? "ogv"
                  : mime.includes("3gpp2")
                    ? "3g2"
                    : mime.includes("3gpp")
                      ? "3gp"
                      : mime.includes("m4v")
                        ? "m4v"
                        : mime.includes("mpeg")
                          ? "mpeg"
                          : mime.includes("mp4")
                            ? "mp4"
                            : mime.includes("x-ms-asf") || mime.includes("asf")
                              ? "asf"
                              : mime.includes("png")
                                ? "png"
                                : mime.includes("gif")
                                  ? "gif"
                                  : mime.includes("webp")
                                    ? "webp"
                                    : mime.includes("avif")
                                      ? "avif"
                                      : mime.includes("heic")
                                        ? "heic"
                                        : mime.includes("heif")
                                          ? "heif"
                                          : mime.includes("bmp")
                                            ? "bmp"
                                            : mime.includes("tiff")
                                              ? "tiff"
                                              : mediaType === "video"
                                                ? "mp4"
                                                : "jpg";
  const extIsCompatible =
    mediaType === "video"
      ? videoExtensions.has(extFromName)
      : imageExtensions.has(extFromName);
  const ext =
    extIsCompatible && allowedExtensions.has(extFromName)
      ? extFromName
      : mimeExtension;
  const fallbackMimeByExtension: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    avif: "image/avif",
    heic: "image/heic",
    heif: "image/heif",
    bmp: "image/bmp",
    tif: "image/tiff",
    tiff: "image/tiff",
    mp4: "video/mp4",
    mov: "video/quicktime",
    qt: "video/quicktime",
    webm: "video/webm",
    ogg: "video/ogg",
    ogv: "video/ogg",
    "3gp": "video/3gpp",
    "3g2": "video/3gpp2",
    m4v: "video/x-m4v",
    mpeg: "video/mpeg",
    mpg: "video/mpeg",
    mp2: "video/mpeg",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
    wmv: "video/x-ms-wmv",
    flv: "video/x-flv",
    ts: "video/mp2t",
    mts: "video/mp2t",
    m2ts: "video/mp2t",
    asf: "video/x-ms-asf",
  };
  const allowedStorageMimeTypes = new Set(
    Object.values(fallbackMimeByExtension),
  );
  const uploadContentType =
    allowedStorageMimeTypes.has(mime) &&
    ((mediaType === "video" && mime.startsWith("video/")) ||
      (mediaType === "image" && mime.startsWith("image/")))
      ? file.type
      : (fallbackMimeByExtension[ext] ??
        (mediaType === "video" ? "video/mp4" : "image/jpeg"));

  return {
    data: { mediaType, extension: ext, contentType: uploadContentType },
    error: null,
  };
}

export async function uploadSessionEvidence({
  file,
  sessionId,
  playerId,
  code,
  token,
  challengeId,
  assignmentId,
  metadata,
}: {
  file: File;
  sessionId: string;
  playerId: string;
  code: string;
  token: string;
  challengeId: string;
  assignmentId: string | null;
  metadata: {
    mediaType: "image" | "video";
    extension: string;
    contentType: string;
  };
}): Promise<ApiResult<string>> {
  return runApi(async () => {
    const storagePath = `${sessionId}/${playerId}/${crypto.randomUUID()}.${metadata.extension}`;
    const { error: storageError } = await supabase.storage
      .from("session-evidence")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: metadata.contentType,
      });
    if (storageError)
      return {
        data: null,
        error: {
          message: `Upload failed: ${storageError.message}. Check the session-evidence Storage bucket and its upload policy.`,
        },
      };
    const { error: registerError } = await supabase.rpc(
      "cc_player_add_session_evidence",
      {
        p_join_code: code,
        p_player_token: token,
        p_challenge_id: challengeId,
        p_secret_assignment_id: assignmentId,
        p_storage_path: storagePath,
        p_media_type: metadata.mediaType,
      },
    );
    if (registerError)
      return {
        data: null,
        error: {
          message: `The file uploaded but couldn't be attached to this task: ${registerError.message}`,
        },
      };
    return { data: storagePath, error: null };
  });
}
