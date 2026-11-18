import Icon from "../../components/ui/Icon";
import SlideshowScreen from "../../components/slideshow/SlideshowScreen";
import SlideshowMessage from "../../components/slideshow/SlideshowMessage";
import SlideshowEvidence from "../../components/slideshow/SlideshowEvidence";
import SlideshowCaption from "../../components/slideshow/SlideshowCaption";
import { sessionEvidenceUrl } from "../../lib/sessionMedia";
import { readSecretSlideshow } from "../../lib/sessionSlideshowQueries";
import type { SecretSlideshowView } from "../../types/sessionSlideshow";
import { useSlideshowData } from "./useSlideshowData";
import { useSlideshowSelection } from "./useSlideshowSelection";
import { useEvidencePlayback } from "./useEvidencePlayback";
import { useSlideshowFullscreen } from "./useSlideshowFullscreen";
import "../../styles/PlayerGame.css";

export default function SecretSlideshow({ sessionId }: { sessionId: string }) {
  const { view, currentIndex, applyView, advance } =
    useSlideshowSelection<SecretSlideshowView>();
  const items = view?.items ?? [];
  const currentItem = items[currentIndex] ?? null;
  const { error, setError } = useSlideshowData({
    sessionId,
    load: readSecretSlideshow,
    onView: applyView,
    failurePrefix: "The secret mission slideshow couldn't load: ",
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
          <span>Connecting to the secret mission slideshow…</span>
        </SlideshowMessage>
      </SlideshowScreen>
    );
  }
  if (!view.open || !view.mission) {
    return (
      <SlideshowScreen>
        <SlideshowMessage>
          <span className="cc-final-tv-kicker">SECRET MISSION</span>
          <h1>Slideshow is waiting</h1>
          <p>The host will open a mission review.</p>
        </SlideshowMessage>
      </SlideshowScreen>
    );
  }
  if (!currentItem) {
    return (
      <SlideshowScreen
        live
        onFullscreen={() => void enterFullscreen()}
        error={error}
      >
        <SlideshowMessage>
          <span className="cc-final-tv-kicker">
            SECRET MISSION · {view.mission.player_name}
          </span>
          <h1>{view.mission.title}</h1>
          <p>{view.mission.description}</p>
          <strong>No photo or video submitted</strong>
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
        alt={`Evidence for ${view.mission.title}`}
        onEnded={next}
        onError={setMediaError}
      />
      <SlideshowCaption
        kicker={<>SECRET MISSION · {view.mission.title}</>}
        title={view.mission.player_name}
      />
    </SlideshowScreen>
  );
}
