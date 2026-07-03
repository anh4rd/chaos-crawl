import imageCompression from "browser-image-compression";
import { supabase } from "./supabase";

export async function uploadPhoto(
  file: File,
  details: {
    playerId: string;
    playerName: string;
    team: string | null;
    challenge: string;
    pub: string;
    points?: number;
  }
) {
  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    });

    const extension =
      compressedFile.name.split(".").pop() || "jpg";

    const fileName =
      `${details.playerId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } =
      await supabase.storage
        .from("photos")
        .upload(fileName, compressedFile, {
          cacheControl: "3600",
          upsert: false,
        });

    if (uploadError) {
      return {
        data: null,
        error: uploadError,
      };
    }

    const { data: publicUrlData } =
      supabase.storage
        .from("photos")
        .getPublicUrl(fileName);

    const { data, error } =
      await supabase
        .from("photos")
        .insert({
          image_url: publicUrlData.publicUrl,
          uploaded_at: new Date().toISOString(),
          player_id: details.playerId,
          player_name: details.playerName,
          team: details.team,
          challenge: details.challenge,
          pub: details.pub,
          points: details.points ?? 0,
        })
        .select()
        .single();

    return { data, error };
  } catch (error) {
    return {
      data: null,
      error: error as Error,
    };
  }
}