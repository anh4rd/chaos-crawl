import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "../../lib/supabase";

export interface Photo {
  id: string | number;

  player_id:
    | string
    | null;

  image_url:
    string;

  uploaded_at:
    string;

  media_type:
    | "image"
    | "video"
    | null;

  player_name:
    | string
    | null;

  team:
    | string
    | null;

  challenge:
    | string
    | null;

  pub:
    | string
    | null;

  points:
    | number
    | null;
}

export function usePhotos() {
  const [
    photos,
    setPhotos,
  ] = useState<Photo[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const loadPhotos =
    useCallback(
      async () => {
        const {
          data,
          error,
        } = await supabase
          .from("photos")
          .select(`
            id,
            player_id,
            image_url,
            uploaded_at,
            media_type,
            player_name,
            team,
            challenge,
            pub,
            points
          `)
          .order(
            "uploaded_at",
            {
              ascending:
                false,
            }
          );

        if (error) {
          console.error(
            "LOAD MEDIA ERROR:",
            error
          );

          setLoading(false);
          return;
        }

        setPhotos(
          (data ?? []) as Photo[]
        );

        setLoading(false);
      },
      []
    );

  useEffect(() => {
    void loadPhotos();

    const channel =
      supabase
        .channel(
          "slideshow-media"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "photos",
          },
          () => {
            void loadPhotos();
          }
        )
        .subscribe(
          (status) => {
            console.log(
              "MEDIA REALTIME:",
              status
            );
          }
        );

    return () => {
      void supabase
        .removeChannel(
          channel
        );
    };
  }, [
    loadPhotos,
  ]);

  return {
    photos,
    loading,
    reload:
      loadPhotos,
  };
}