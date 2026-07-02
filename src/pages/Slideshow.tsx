import { useEffect, useState } from "react";
import { usePhotos } from "../hooks/usePhotos";
import { useNavigate } from "react-router-dom";

export default function Slideshow() {
    const navigate = useNavigate();
  const photos = usePhotos();

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (photos.length === 0) return;

    const interval = setInterval(() => {
      setIndex((current) => (current + 1) % photos.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [photos]);
  // Keyboard controls
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (photos.length === 0) return;

      if (event.key === "ArrowRight") {
        setIndex((current) => (current + 1) % photos.length);
      }

      if (event.key === "ArrowLeft") {
        setIndex((current) =>
          (current - 1 + photos.length) % photos.length
        );
      }
    }

    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [photos]);

  if (photos.length === 0) {
    return <div>Waiting for photos...</div>;
  }

  const photo = photos[index];

  if (photos.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white text-3xl">
        Waiting for photos...
      </div>
    );
  }

  return (

<main className="flex h-screen flex-col bg-black text-white">

    <div className="p-8 text-center">

        <div className="text-2xl">

            📍 {photo.pub}

        </div>

        <div className="mt-2 text-4xl font-bold">

            ⭐ {photo.challenge}

        </div>

    </div>

    <div className="flex flex-1 items-center justify-center">

        <img

            src={photo.image_url}

            className="max-h-[70vh] rounded-3xl"

        />

    </div>

    <div className="flex justify-between p-8 text-2xl">

        <div>

            👤 {photo.player_name}

        </div>

        <div>

            {photo.team}

        </div>

        <div>

            🏆 {photo.points} pts

        </div>

    </div>

</main>

);
  navigate("/slideshow");

}