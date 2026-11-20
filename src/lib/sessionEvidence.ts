import { runApi, type ApiResult } from "./apiResult";
import { supabase } from "./sessionSupabase";

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

const imageExtensions = new Set(
  Object.keys(fallbackMimeByExtension).filter((extension) =>
    fallbackMimeByExtension[extension].startsWith("image/"),
  ),
);
const videoExtensions = new Set(
  Object.keys(fallbackMimeByExtension).filter((extension) =>
    fallbackMimeByExtension[extension].startsWith("video/"),
  ),
);
const allowedStorageMimeTypes = new Set(Object.values(fallbackMimeByExtension));
const mimeExtensions: readonly (readonly [string, string])[] = [
  ["quicktime", "mov"],
  ["matroska", "mkv"],
  ["msvideo", "avi"],
  ["ms-wmv", "wmv"],
  ["x-flv", "flv"],
  ["mp2t", "ts"],
  ["webm", "webm"],
  ["ogg", "ogv"],
  ["3gpp2", "3g2"],
  ["3gpp", "3gp"],
  ["m4v", "m4v"],
  ["mpeg", "mpeg"],
  ["mp4", "mp4"],
  ["asf", "asf"],
  ["png", "png"],
  ["gif", "gif"],
  ["webp", "webp"],
  ["avif", "avif"],
  ["heic", "heic"],
  ["heif", "heif"],
  ["bmp", "bmp"],
  ["tiff", "tiff"],
];

function evidenceMediaType(mime: string, extension: string) {
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("image/")) return "image";
  if (videoExtensions.has(extension)) return "video";
  if (imageExtensions.has(extension)) return "image";
  return null;
}

export function prepareSessionEvidence(
  file: Pick<File, "name" | "size" | "type">,
): ApiResult<{
  mediaType: "image" | "video";
  extension: string;
  contentType: string;
}> {
  // Mobile browsers can leave File.type blank for HEIC/MOV; the filename is the fallback.
  const extFromName = file.name.includes(".")
    ? (file.name.split(".").pop()?.toLowerCase() ?? "")
    : "";
  const mime = (file.type || "").toLowerCase();
  const mediaType = evidenceMediaType(mime, extFromName);
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

  const defaultExtension = mediaType === "video" ? "mp4" : "jpg";
  const mimeExtension =
    mimeExtensions.find(([fragment]) => mime.includes(fragment))?.[1] ??
    defaultExtension;
  const extIsCompatible =
    mediaType === "video"
      ? videoExtensions.has(extFromName)
      : imageExtensions.has(extFromName);
  const extension = extIsCompatible ? extFromName : mimeExtension;
  const recognizedMime =
    allowedStorageMimeTypes.has(mime) && mime.startsWith(`${mediaType}/`);
  const defaultMime = mediaType === "video" ? "video/mp4" : "image/jpeg";
  const contentType = recognizedMime
    ? file.type
    : (fallbackMimeByExtension[extension] ?? defaultMime);
  return { data: { mediaType, extension, contentType }, error: null };
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

export async function downloadSessionEvidence(
  storagePath: string,
): Promise<ApiResult<Blob>> {
  return runApi(() =>
    supabase.storage.from("session-evidence").download(storagePath),
  );
}
