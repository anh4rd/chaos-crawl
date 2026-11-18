import { useEffect } from "react";
import { useMedia } from "../../game/hooks/useMedia";
import { useGameState } from "../../game/hooks/useGameState";
import DataError from "../../components/ui/DataError";
import SlideshowScreen from "../../components/slideshow/SlideshowScreen";
import Note from "../../components/ui/Note";
import SlideshowPlayer from "./SlideshowPlayer";

import { useEndSlideshow } from "./useEndSlideshow";

export default function LegacySlideshow({
  isHost,
  onReturn,
}: {
  isHost: boolean;
  onReturn: (host: boolean) => void;
}) {
  const mediaQuery = useMedia();
  const gameQuery = useGameState();
  const { ending, end } = useEndSlideshow(isHost, () => onReturn(true));
  const open = gameQuery.data?.slideshow_open;
  useEffect(() => {
    if (open === false) onReturn(isHost);
  }, [open, isHost, onReturn]);

  if (gameQuery.error)
    return <DataError error={gameQuery.error} retry={gameQuery.reload} />;
  if (mediaQuery.error)
    return <DataError error={mediaQuery.error} retry={mediaQuery.reload} />;
  if (!gameQuery.data || (mediaQuery.loading && !mediaQuery.data.length))
    return (
      <SlideshowScreen variant="playback-loading">
        <Note variant="playback-loading">Loading slideshow...</Note>
      </SlideshowScreen>
    );
  return (
    <SlideshowPlayer
      media={mediaQuery.data}
      isHost={isHost}
      ending={ending}
      end={() => void end()}
      reload={mediaQuery.reload}
    />
  );
}
