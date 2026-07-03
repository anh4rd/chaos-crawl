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
  const extension =
    file.name.split(".").pop() || "jpg";

  const fileName =
    `${details.playerId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  // Upload image to Supabase Storage
  const { error: uploadError } =
    await supabase.storage
      .from("photos")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

  if (uploadError) {
    return {
      data: null,
      error: uploadError,
    };
  }

  // Get public URL
  const { data: publicUrlData } =
    supabase.storage
      .from("photos")
      .getPublicUrl(fileName);

  const imageUrl =
    publicUrlData.publicUrl;

  // Insert photo metadata into photos table
  const { data, error } =
    await supabase
      .from("photos")
      .insert({
        image_url: imageUrl,
        uploaded_at:
          new Date().toISOString(),
        player_id: details.playerId,
        player_name: details.playerName,
        team: details.team,
        challenge: details.challenge,
        pub: details.pub,
        points: details.points ?? 0,
      })
      .select()
      .single();

  return {
    data,
    error,
  };
}