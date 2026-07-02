import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function usePhotos() {
  const [photos, setPhotos] = useState<any[]>([]);

  async function load() {
    const { data } = await supabase
      .from("photos")
      .select("*")
      .order("uploaded_at");

    setPhotos(data ?? []);
  }

  useEffect(() => {
    load();

    const channel = supabase
      .channel("photos")

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "photos",
        },
        load
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return photos;
}