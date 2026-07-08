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

import Button
  from "../components/ui/Button";


export default function Slideshow() {
  const {
    photos,
    loading,
    reload,
  } = usePhotos();

  const game =
    useGameState();

  const navigate =
    useNavigate();

  const [
    searchParams,
  ] = useSearchParams();

  const isHost =
    searchParams.get("host") ===
    "true";

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(0);

  const [
    paused,
    setPaused,
  ] = useState(false);

  const [
    mediaError,
    setMediaError,
  ] = useState(false);

  const [
    ending,
    setEnding,
  ] = useState(false);


  // -------------------------
  // RETURN WHEN HOST CLOSES
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
    if (photos.length === 0) {
      setCurrentIndex(0);
      return;
    }

    if (
      currentIndex >=
      photos.length
    ) {
      setCurrentIndex(0);
    }
  }, [
    photos.length,
    currentIndex,
  ]);


  // -------------------------
  // CURRENT MEDIA
  // -------------------------

  const currentPhoto =
    photos.length > 0
      ? photos[currentIndex]
      : null;


  // -------------------------
  // CLEAR ERROR ON CHANGE
  // -------------------------

  useEffect(() => {
    setMediaError(false);
  }, [
    currentIndex,
    currentPhoto?.image_url,
  ]);


  // -------------------------
  // NEXT / PREVIOUS
  // -------------------------

  function nextMedia() {
    if (photos.length === 0) {
      return;
    }

    setCurrentIndex(
      (current) =>
        (current + 1) %
        photos.length
    );
  }


  function previousMedia() {
    if (photos.length === 0) {
      return;
    }

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


  // -------------------------
  // AUTO ADVANCE IMAGES
  // -------------------------

  useEffect(() => {
    if (
      paused ||
      photos.length <= 1 ||
      !currentPhoto
    ) {
      return;
    }

    // Videos move on when onEnded fires.
    if (
      currentPhoto.media_type ===
      "video"
    ) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setCurrentIndex(
          (current) =>
            (current + 1) %
            photos.length
        );
      }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    paused,
    photos.length,
    currentIndex,
    currentPhoto?.id,
    currentPhoto?.media_type,
  ]);


  // -------------------------
  // PRELOAD NEXT IMAGE ONLY
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

    if (
      !nextPhoto?.image_url ||
      nextPhoto.media_type ===
        "video"
    ) {
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
        event.key ===
        "ArrowRight"
      ) {
        setCurrentIndex(
          (current) =>
            (current + 1) %
            photos.length
        );
      }

      if (
        event.key ===
        "ArrowLeft"
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

    setEnding(true);

    const {
      error,
    } = await updateGameState({
      slideshow_open: false,
    });

    if (error) {
      setEnding(false);

      console.error(
        "END SLIDESHOW ERROR:",
        error
      );

      alert(
        `Could not end slideshow: ${error.message}`
      );

      return;
    }

    // Realtime should redirect,
    // but host navigation is immediate.
    navigate(
      "/admin",
      {
        replace: true,
      }
    );
  }


  // -------------------------
  // LOADING
  // -------------------------

  if (
    !game ||
    loading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black p-8 text-center text-white">
        <p className="text-xl">
          Loading slideshow...
        </p>
      </main>
    );
  }


  // -------------------------
  // NO MEDIA
  // -------------------------

  if (
    photos.length === 0 ||
    !currentPhoto
  ) {
    return (
      <main className="relative flex min-h-screen items-center justify-center bg-black p-8 text-center text-white">

        <div>
          <h1 className="text-5xl font-bold">
            Anna&apos;s Chaos Crawl
          </h1>

          <p className="mt-6 text-2xl">
            Waiting for chaos...
          </p>

          <div className="mt-6">
            <Button
              type="button"
              onClick={() => {
                void reload();
              }}
            >
              Check for uploads
            </Button>
          </div>
        </div>


        {isHost && (
          <div className="absolute right-6 top-6">
            <Button
              type="button"
              disabled={ending}
              onClick={
                endSlideshow
              }
            >
              {ending
                ? "Ending..."
                : "End Slideshow"}
            </Button>
          </div>
        )}

      </main>
    );
  }


  // -------------------------
  // SLIDESHOW
  // -------------------------

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black">

      {/* MEDIA */}

      {mediaError ? (
        <div className="max-w-md p-8 text-center text-white">
          <h2 className="text-2xl font-bold">
            Could not load this upload
          </h2>

          <p className="mt-3 text-zinc-400">
            The file may be unavailable
            or use an unsupported format.
          </p>

          <div className="mt-6">
            <Button
              type="button"
              onClick={nextMedia}
            >
              Skip to next
            </Button>
          </div>
        </div>
      ) : currentPhoto.media_type ===
        "video" ? (
        <video
          key={
            currentPhoto.image_url
          }
          src={
            currentPhoto.image_url
          }
          className="h-screen w-screen object-contain"
          autoPlay={!paused}
          playsInline
          controls
          onEnded={nextMedia}
          onError={() => {
            setMediaError(true);
          }}
        />
      ) : (
        <img
          key={
            currentPhoto.image_url
          }
          src={
            currentPhoto.image_url
          }
          alt="Chaos Crawl upload"
          className="h-screen w-screen object-contain"
          onError={() => {
            setMediaError(true);
          }}
        />
      )}


      {/* INFO */}

      <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/70 p-6 text-white text-s">

        {currentPhoto.pub && (
          <p className="text-sm uppercase">
            📍 {currentPhoto.pub}
          </p>
        )}

        {currentPhoto.challenge && (
          <h1 className="mt-1 text-3xl font-bold">
            {
              currentPhoto.challenge
            }
          </h1>
        )}

        {currentPhoto.player_name && (
          <p className="mt-2 text-xl">
            {
              currentPhoto.player_name
            }

            {currentPhoto.team
              ? ` • ${currentPhoto.team}`
              : ""}
          </p>
        )}

      </div>


      {/* COUNTER */}

      <div className="absolute left-6 top-6 z-20 rounded-xl bg-black/70 px-4 py-2 text-white">
        {currentIndex + 1}
        {" / "}
        {photos.length}
      </div>


      {/* HOST CONTROLS */}

      {isHost && (
        <div className="absolute right-6 top-6 z-20 flex max-w-[70%] flex-wrap justify-end gap-2">

          <Button
            type="button"
            onClick={
              previousMedia
            }
          >
            ← Previous
          </Button>

          <Button
            type="button"
            onClick={() => {
              setPaused(
                (current) =>
                  !current
              );
            }}
          >
            {paused
              ? "▶ Resume"
              : "⏸ Pause"}
          </Button>

          <Button
            type="button"
            onClick={
              nextMedia
            }
          >
            Next →
          </Button>

          <Button
            type="button"
            disabled={ending}
            onClick={
              endSlideshow
            }
          >
            {ending
              ? "Ending..."
              : "End Slideshow"}
          </Button>

        </div>
      )}


      {paused && (
        <div className="absolute right-6 top-24 z-20 rounded-xl bg-black/70 px-4 py-2 text-white">
          PAUSED
        </div>
      )}

    </main>
  );
}