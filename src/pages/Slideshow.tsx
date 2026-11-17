import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMedia } from "../game/hooks/useMedia";
import { useGameState } from "../game/hooks/useGameState";
import { updateGameState } from "../lib/gameApi";
import DataError from "../components/ui/DataError";
import SlideshowPlayer from "../features/slideshow/SlideshowPlayer";

export default function Slideshow() {
  const mediaQuery = useMedia();
  const gameQuery = useGameState();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isHost = searchParams.get("host") === "true";
  const [ending, setEnding] = useState(false);
  const open = gameQuery.data?.slideshow_open;
  useEffect(() => {
    if (open === false)
      navigate(isHost ? "/admin" : "/game", { replace: true });
  }, [open, isHost, navigate]);

  async function endSlideshow() {
    if (ending || !window.confirm("End slideshow for everyone?")) return;
    setEnding(true);
    const { error } = await updateGameState({ slideshow_open: false });
    if (error) {
      setEnding(false);
      alert(`Could not end slideshow: ${error.message}`);
      return;
    }
    navigate("/admin", { replace: true });
  }

  const failed = gameQuery.error
    ? gameQuery
    : mediaQuery.error
      ? mediaQuery
      : null;
  if (failed) return <DataError error={failed.error!} retry={failed.reload} />;
  if (!gameQuery.data || (mediaQuery.loading && !mediaQuery.data.length))
    return (
      <main className="flex min-h-screen items-center justify-center bg-black p-8 text-center text-white">
        <p className="text-xl">Loading slideshow...</p>
      </main>
    );
  return (
    <SlideshowPlayer
      media={mediaQuery.data}
      isHost={isHost}
      ending={ending}
      end={() => void endSlideshow()}
      reload={mediaQuery.reload}
    />
  );
}
