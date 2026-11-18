import Icon from "../../components/ui/Icon";
import SlideshowScreen from "../../components/slideshow/SlideshowScreen";
import SlideshowMessage from "../../components/slideshow/SlideshowMessage";
import SlideshowEvidence from "../../components/slideshow/SlideshowEvidence";
import SlideshowCaption from "../../components/slideshow/SlideshowCaption";
import { sessionEvidenceUrl } from "../../lib/sessionMedia";
import { readFinalSlideshow } from "../../lib/sessionSlideshowQueries";
import type { FinalSlideshowView } from "../../types/sessionSlideshow";
import { useSlideshowData } from "./useSlideshowData";
import { useSlideshowSelection } from "./useSlideshowSelection";
import { useEvidencePlayback } from "./useEvidencePlayback";
import { useSlideshowFullscreen } from "./useSlideshowFullscreen";
import "../../styles/PlayerGame.css";

export default function FinalSlideshow({ sessionId }: { sessionId: string }) {
  const { view, currentIndex, applyView, advance } =
    useSlideshowSelection<FinalSlideshowView>();
  const items = view?.items ?? [];
  const currentItem = items[currentIndex] ?? null;
  const { error, setError } = useSlideshowData({
    sessionId,
    load: readFinalSlideshow,
    onView: applyView,
    failurePrefix: "The TV slideshow couldn't load: ",
  });
  const { mediaError, setMediaError, next } = useEvidencePlayback({
    open: view?.open ?? false,
    currentIndex,
    itemId: currentItem?.id,
    mediaType: currentItem?.media_type,
    itemCount: items.length,
    advance,
  });
  const enterFullscreen = useSlideshowFullscreen(setError);

  if (error && !view) {
    return (
      <SlideshowScreen>
        <p className="cc-final-tv-error" role="alert">
          {error}
        </p>
      </SlideshowScreen>
    );
  }

  if (!view) {
    return (
      <SlideshowScreen>
        <SlideshowMessage>
          <Icon name="loader-circle" className="icon--size-28 cc-spin" />
          <span>Connecting to the final slideshow…</span>
        </SlideshowMessage>
      </SlideshowScreen>
    );
  }

  if (!view.open) {
    return (
      <SlideshowScreen>
        <SlideshowMessage>
          <span className="cc-final-tv-kicker">FINAL ROUND</span>
          <h1>Slideshow is waiting</h1>
          <p>The host will open the final round and choose a side challenge.</p>
        </SlideshowMessage>
      </SlideshowScreen>
    );
  }

  if (!currentItem) {
    return (
      <SlideshowScreen>
        <SlideshowMessage>
          <span className="cc-final-tv-kicker">FINAL ROUND</span>
          <h1>Waiting for submissions</h1>
          <p>
            Submitted photos and videos for the selected side challenge will
            appear here.
          </p>
        </SlideshowMessage>
      </SlideshowScreen>
    );
  }

  return (
    <SlideshowScreen
      live
      counter={{ index: currentIndex, total: items.length }}
      onFullscreen={() => void enterFullscreen()}
      error={error || mediaError}
    >
      <SlideshowEvidence
        id={currentItem.id}
        mediaType={currentItem.media_type}
        src={sessionEvidenceUrl(currentItem.storage_path)}
        alt={`${currentItem.player_name}'s entry for ${currentItem.challenge_title}`}
        onEnded={next}
        onError={setMediaError}
      />
      <SlideshowCaption
        kicker={currentItem.challenge_title}
        title={currentItem.player_name}
      />
    </SlideshowScreen>
  );
}
