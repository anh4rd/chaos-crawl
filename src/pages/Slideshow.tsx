import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  usePhotos,
} from "../game/hooks/usePhotos";

import {
  useGameState,
} from "../game/hooks/useGameState";

import {
  updateGameState,
} from "../lib/gameApi";

import Button from "../components/ui/Button";


export default function Slideshow() {
  const photos = usePhotos();
  const game = useGameState();
  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  const isHost =
    searchParams.get("host") === "true";

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(0);

  const [
    paused,
    setPaused,
  ] = useState(false);


  // -------------------------
  // HOST ENDS SLIDESHOW
  // → EVERYONE RETURNS
  // -------------------------

  useEffect(() => {
    if (!game) {
      return;
    }

    if (
      game.slideshow_open !== true
    ) {
      navigate(
        isHost
          ? "/admin"
          : "/game",
        {
          replace: true,
        }
      );
    }
  }, [
    game?.slideshow_open,
    isHost,
    navigate,
  ]);


  // -------------------------
  // KEEP INDEX VALID
  // -------------------------

  useEffect(() => {
    if (
      photos.length > 0 &&
      currentIndex >= photos.length
    ) {
      setCurrentIndex(0);
    }
  }, [
    photos.length,
    currentIndex,
  ]);


  // -------------------------
  // AUTO ADVANCE
  // -------------------------

  useEffect(() => {
    if (
      paused ||
      photos.length <= 1
    ) {
      return;
    }

    const timer =
      window.setInterval(() => {
        setCurrentIndex(
          (current) =>
            (current + 1) %
            photos.length
        );
      }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, [
    paused,
    photos.length,
  ]);


  // -------------------------
  // PRELOAD NEXT IMAGE
  // -------------------------

  useEffect(() => {
    if (
      photos.length <= 1
    ) {
      return;
    }

    const nextIndex =
      (currentIndex + 1) %
      photos.length;

    const nextPhoto =
      photos[nextIndex];

    if (!nextPhoto?.image_url) {
      return;
    }

    const image =
      new Image();

    image.src =
      nextPhoto.image_url;
  }, [
    currentIndex,
    photos,
  ]);


  // -------------------------
  // KEYBOARD CONTROLS
  // -------------------------

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (
        photos.length === 0
      ) {
        return;
      }

      if (
        event.key === "ArrowRight"
      ) {
        setCurrentIndex(
          (current) =>
            (current + 1) %
            photos.length
        );
      }

      if (
        event.key === "ArrowLeft"
      ) {
        setCurrentIndex(
          (current) =>
            (
              current -
              1 +
              photos.length
            ) %
            photos.length
        );
      }

      if (
        event.key === " "
      ) {
        event.preventDefault();

        setPaused(
          (current) =>
            !current
        );
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
  }, [
    photos.length,
  ]);


  // -------------------------
  // END SLIDESHOW
  // -------------------------

  async function endSlideshow() {
    const confirmed =
      window.confirm(
        "End slideshow for everyone?"
      );

    if (!confirmed) {
      return;
    }

    const { error } =
      await updateGameState({
        slideshow_open: false,
      });

    if (error) {
      console.error(
        "END SLIDESHOW ERROR:",
        error
      );

      alert(
        `Could not end slideshow: ${error.message}`
      );
    }
  }


  // -------------------------
  // LOADING GAME STATE
  // -------------------------

  if (!game) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black p-8 text-center text-white">
        <p>
          Loading slideshow...
        </p>
      </main>
    );
  }


  // -------------------------
  // NO PHOTOS
  // -------------------------

  if (photos.length === 0) {
    return (
      <main className="relative flex min-h-screen items-center justify-center bg-black p-8 text-center text-white">

        <div>
          <h1 className="text-6xl font-bold">
            Anna's Chaos Crawl
          </h1>

          <p className="mt-6 text-2xl">
            Waiting for chaos...
          </p>
        </div>


        {isHost && (
          <div className="absolute right-6 top-6">
            <Button
              type="button"
              onClick={endSlideshow}
            >
              End Slideshow
            </Button>
          </div>
        )}

      </main>
    );
  }


  // -------------------------
  // CURRENT PHOTO
  // -------------------------

  const currentPhoto =
    photos[currentIndex];


  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black">

      <img
        src={
          currentPhoto.image_url
        }
        alt="Chaos Crawl submission"
        className="h-screen w-screen object-contain"
      />


      {/* PHOTO INFO */}

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

      </div>


      {/* PHOTO COUNTER */}

      <div className="absolute left-6 top-6 rounded-xl bg-black/70 px-4 py-2 text-white">
        {currentIndex + 1}
        {" / "}
        {photos.length}
      </div>


      {/* PAUSED STATUS */}

      {paused && (
        <div className="absolute right-6 top-20 rounded-xl bg-black/70 px-4 py-2 text-white">
          PAUSED
        </div>
      )}


      {/* HOST CONTROL */}

      {isHost && (
        <div className="absolute right-6 top-6 z-20">
          <Button
            type="button"
            onClick={endSlideshow}
          >
            End Slideshow
          </Button>
        </div>
      )}

    </main>
  );
}