import imageCompression
  from "browser-image-compression";

import {
  supabase,
} from "./supabase";

export type MediaType =
  | "image"
  | "video";

export interface UploadMediaDetails {
  playerId: string;
  playerName: string;
  team: string | null;
  challenge: string;
  pub: string;
  points?: number;
}

const MAX_VIDEO_SIZE_MB = 100;

export async function uploadPhoto(
  file: File,
  details: UploadMediaDetails
) {
  try {
    const isImage =
      file.type.startsWith(
        "image/"
      );

    const isVideo =
      file.type.startsWith(
        "video/"
      );

    if (
      !isImage &&
      !isVideo
    ) {
      return {
        data: null,
        error: new Error(
          "Please choose a photo or video."
        ),
      };
    }

    if (isVideo) {
      const sizeMB =
        file.size /
        1024 /
        1024;

      if (
        sizeMB >
        MAX_VIDEO_SIZE_MB
      ) {
        return {
          data: null,
          error: new Error(
            `Video is too large. Maximum size is ${MAX_VIDEO_SIZE_MB}MB.`
          ),
        };
      }
    }

    const mediaType:
      MediaType =
      isVideo
        ? "video"
        : "image";

    let fileToUpload:
      File = file;

    if (isImage) {
      fileToUpload =
        await imageCompression(
          file,
          {
            maxSizeMB: 1,
            maxWidthOrHeight:
              1920,
            useWebWorker:
              true,
          }
        );
    }

    const originalExtension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase();

    const extension =
      originalExtension ||
      (
        isVideo
          ? "mp4"
          : "jpg"
      );

    const fileName =
      `${details.playerId}/` +
      `${Date.now()}-` +
      `${crypto.randomUUID()}.` +
      `${extension}`;

    const {
      error: uploadError,
    } = await supabase
      .storage
      .from("photos")
      .upload(
        fileName,
        fileToUpload,
        {
          cacheControl:
            "3600",

          upsert:
            false,

          contentType:
            file.type ||
            fileToUpload.type,
        }
      );

    if (uploadError) {
      console.error(
        "STORAGE UPLOAD ERROR:",
        uploadError
      );

      return {
        data: null,
        error: uploadError,
      };
    }

    const {
      data: publicUrlData,
    } = supabase
      .storage
      .from("photos")
      .getPublicUrl(
        fileName
      );

    const {
      data,
      error: insertError,
    } = await supabase
      .from("photos")
      .insert({
        image_url:
          publicUrlData.publicUrl,

        uploaded_at:
          new Date()
            .toISOString(),

        player_id:
          details.playerId,

        player_name:
          details.playerName,

        team:
          details.team,

        challenge:
          details.challenge,

        pub:
          details.pub,

        points:
          details.points ?? 0,

        media_type:
          mediaType,
      })
      .select()
      .single();

    if (insertError) {
      console.error(
        "MEDIA ROW INSERT ERROR:",
        insertError
      );

      await supabase
        .storage
        .from("photos")
        .remove([
          fileName,
        ]);

      return {
        data: null,
        error:
          insertError,
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error(
      "UPLOAD MEDIA ERROR:",
      error
    );

    return {
      data: null,

      error:
        error instanceof Error
          ? error
          : new Error(
              "Unknown upload error."
            ),
    };
  }
}