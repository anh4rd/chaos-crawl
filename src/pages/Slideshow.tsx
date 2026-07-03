import { useEffect, useState } from "react";

import { usePhotos } from "../hooks/usePhotos";

export default function Slideshow() {
  const photos = usePhotos();

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [paused, setPaused] =
    useState(false);

  // Keep index valid if photos change
  useEffect(() => {
    if (
      photos.length > 0 &&
      currentIndex >= photos.length
    ) {
      setCurrentIndex(0);
    }
  }, [photos.length, currentIndex]);

  // Auto advance every 5 seconds
  useEffect(() => {
    if (paused || photos.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentIndex((current) =>
        (current + 1) % photos.length
      );
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, [paused, photos.length]);

  // Keyboard controls
  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (photos.length === 0) {
        return;
      }

      if (event.key === "ArrowRight") {
        setCurrentIndex((current) =>
          (current + 1) % photos.length
        );
      }

      if (event.key === "ArrowLeft") {
        setCurrentIndex((current) =>
          (current - 1 + photos.length) %
          photos.length
        );
      }

      if (event.key === " ") {
        event.preventDefault();

        setPaused((current) => !current);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [photos.length]);

  if (photos.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8 text-center">
        <div>
          <h1 className="text-6xl font-bold">
            Anna's Chaos Crawl
          </h1>

          <p className="mt-6 text-2xl">
            Waiting for chaos...
          </p>
        </div>
      </main>
    );
  }

  const currentPhoto =
    photos[currentIndex];

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black">
      <img
        src={currentPhoto.image_url}
        alt="Chaos Crawl upload"
        className="h-screen w-screen object-contain"
      />

      <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-6 text-white">
        {currentPhoto.pub && (
          <p className="text-sm uppercase">
            📍 {currentPhoto.pub}
          </p>
        )}

        {currentPhoto.challenge && (
          <h1 className="mt-1 text-3xl font-bold">
            {currentPhoto.challenge}
          </h1>
        )}

        {currentPhoto.player_name && (
          <p className="mt-2 text-xl">
            {currentPhoto.player_name}
            {currentPhoto.team
              ? ` • ${currentPhoto.team}`
              : ""}
          </p>
        )}

        {currentPhoto.points != null && (
          <p className="mt-2 font-bold">
            +{currentPhoto.points} points
          </p>
        )}
      </div>

      {paused && (
        <div className="absolute right-6 top-6 rounded-xl bg-black/70 px-4 py-2 text-white">
          PAUSED
        </div>
      )}

      <div className="absolute left-6 top-6 rounded-xl bg-black/70 px-4 py-2 text-white">
        {currentIndex + 1} / {photos.length}
      </div>
    </main>
  );
}