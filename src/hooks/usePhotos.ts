import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export interface Photo {
  id: number;
  player_id: string | null;
  image_url: string;
  uploaded_at: string;

  player_name?: string | null;
  team?: string | null;
  challenge?: string | null;
  pub?: string | null;
  points?: number | null;
}

export function usePhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);

  async function loadPhotos() {
    const { data, error } = await supabase
      .from("photos")
      .select(
        "id, image_url, uploaded_at, player_name, team, challenge, pub, points"
      )
      .order("uploaded_at", {
        ascending: false,
      });

    if (error) {
      console.error("LOAD PHOTOS ERROR", error);
      return;
    }

    setPhotos((data ?? []) as Photo[]);
  }

  useEffect(() => {
    loadPhotos();

    const channel = supabase
      .channel("slideshow-photos")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "photos",
        },
        () => {
          loadPhotos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return photos;
}