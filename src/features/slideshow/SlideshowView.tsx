import type { ReactNode } from "react";
import type { Media } from "../../types/database";
import Button from "../../components/ui/Button";
import SlideshowScreen from "../../components/slideshow/SlideshowScreen";
import EmptySlideshow from "../../components/slideshow/EmptySlideshow";
import CountBadge from "../../components/ui/CountBadge";
import Badge from "../../components/ui/Badge";
import ControlRow from "../../components/ui/ControlRow";
import PlaybackControls from "../../components/slideshow/PlaybackControls";
import UploadCaption from "./UploadCaption";

export default function SlideshowView({
  as: Frame = "main",
  current,
  currentIndex,
  itemCount,
  paused,
  isHost,
  ending,
  end,
  reload,
  previous,
  next,
  togglePaused,
  slide,
}: {
  as?: "main" | "div";
  current: Media | null;
  currentIndex: number;
  itemCount: number;
  paused: boolean;
  isHost: boolean;
  ending: boolean;
  end: () => void;
  reload: () => Promise<void>;
  previous: () => void;
  next: () => void;
  togglePaused: () => void;
  slide: ReactNode;
}) {
  const endButton = (
    <Button type="button" disabled={ending} onClick={end}>
      {ending ? "Ending..." : "End Slideshow"}
    </Button>
  );
  if (!current)
    return (
      <SlideshowScreen as={Frame} variant="playback-empty">
        <EmptySlideshow reload={reload} />
        {isHost && <ControlRow variant="playback-end">{endButton}</ControlRow>}
      </SlideshowScreen>
    );
  return (
    <SlideshowScreen as={Frame} variant="playback">
      {slide}
      <UploadCaption media={current} />
      <CountBadge as="div" variant="playback" aria-label="Slide counter">
        {currentIndex + 1} / {itemCount}
      </CountBadge>
      {isHost && (
        <PlaybackControls
          paused={paused}
          previous={previous}
          togglePaused={togglePaused}
          next={next}
          endAction={endButton}
        />
      )}
      {paused && (
        <Badge as="div" variant="playback">
          PAUSED
        </Badge>
      )}
    </SlideshowScreen>
  );
}
