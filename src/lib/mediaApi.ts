import imageCompression from "browser-image-compression";
import { supabase } from "./supabase";
import {
  apiError,
  invalidResult,
  runApi,
  type ApiError,
  type ApiResult,
} from "./apiResult";
import type { Media } from "../types/database";

export type MediaType = "image" | "video";
export interface UploadMediaDetails {
  playerId: string;
  playerName: string;
  team: string | null;
  challenge: string;
  pub: string;
  points?: number;
}

const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
  "image/svg+xml": "svg",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/ogg": "ogv",
  "video/x-msvideo": "avi",
};

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

function validateMedia(file: File, details: UploadMediaDetails): MediaType {
  const mediaType = file.type.startsWith("image/")
    ? "image"
    : file.type.startsWith("video/")
      ? "video"
      : null;
  if (!mediaType || !extensions[file.type])
    throw invalidResult("Please choose a supported photo or video format.")
      .error;
  if (
    !details.playerId.trim() ||
    !details.playerName.trim() ||
    !Number.isFinite(details.points ?? 0)
  )
    throw invalidResult("A player and finite points are required.").error;
  if (mediaType === "video" && file.size > MAX_VIDEO_BYTES)
    throw invalidResult("Video is too large. Maximum size is 100MB.").error;
  return mediaType;
}

async function prepareMedia(file: File, mediaType: MediaType) {
  const output =
    mediaType === "image"
      ? await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        })
      : file;
  const extension = extensions[output.type];
  if (!extension || !output.type.startsWith(`${mediaType}/`))
    throw invalidResult("The processed media format is unsupported.").error;
  return { output, extension };
}

async function failedUpload(
  error: unknown,
  uploadedPath: string | null,
): Promise<ApiResult<Media>> {
  const failure: ApiError = apiError(error);
  if (!uploadedPath) return { data: null, error: failure };
  const cleanup = await runApi(() =>
    supabase.storage.from("photos").remove([uploadedPath]),
  );
  return {
    data: null,
    error: cleanup.error
      ? {
          ...failure,
          message: `${failure.message} Storage cleanup failed: ${cleanup.error.message}`,
        }
      : failure,
  };
}

export async function uploadMedia(
  file: File,
  details: UploadMediaDetails,
): Promise<ApiResult<Media>> {
  let uploadedPath: string | null = null;
  try {
    const mediaType = validateMedia(file, details);
    const { output, extension } = await prepareMedia(file, mediaType);
    const path = `${details.playerId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const upload = await runApi(() =>
      supabase.storage.from("photos").upload(path, output, {
        cacheControl: "3600",
        upsert: false,
        contentType: output.type,
      }),
    );
    if (upload.error) return { data: null, error: upload.error };
    uploadedPath = path;
    const { data: publicUrl } = supabase.storage
      .from("photos")
      .getPublicUrl(path);
    const result = await runApi<Media>(() =>
      supabase
        .from("photos")
        .insert({
          image_url: publicUrl.publicUrl,
          uploaded_at: new Date().toISOString(),
          player_id: details.playerId,
          player_name: details.playerName,
          team: details.team,
          challenge: details.challenge,
          pub: details.pub,
          points: details.points ?? 0,
          media_type: mediaType,
        })
        .select()
        .single(),
    );
    if (result.error) return failedUpload(result.error, uploadedPath);
    if (!result.data)
      return failedUpload(
        new Error("The uploaded media record was not returned."),
        uploadedPath,
      );
    return result;
  } catch (error) {
    return failedUpload(error, uploadedPath);
  }
}
