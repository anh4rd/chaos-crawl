import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Icon from "../components/ui/Icon";
import SlideshowScreen from "../components/slideshow/SlideshowScreen";
import SlideshowMessage from "../components/slideshow/SlideshowMessage";
import SlideshowEvidence from "../components/slideshow/SlideshowEvidence";
import SlideshowCaption from "../components/slideshow/SlideshowCaption";
import { supabase } from "../lib/sessionSupabase";
import "../styles/PlayerGame.css";

interface SecretSlideshowItem {
  id: string;
  media_type: "image" | "video";
  storage_path: string;
}

interface SecretSlideshowView {
  open: boolean;
  assignment_id: string | null;
  evidence_id: string | null;
  mission: { title: string; description: string; player_name: string } | null;
  items: SecretSlideshowItem[];
}

function mediaUrl(storagePath: string) {
  return supabase.storage.from("session-evidence").getPublicUrl(storagePath)
    .data.publicUrl;
}

export default function SessionSecretSlideshow() {
  const { sessionId = "" } = useParams();
  const [view, setView] = useState<SecretSlideshowView | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState("");
  const [mediaError, setMediaError] = useState("");
  const lastHostEvidenceId = useRef<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let active = true;
    let requestId = 0;
    let latestAppliedRequestId = 0;

    const refresh = async () => {
      const currentRequestId = ++requestId;
      const { data, error: loadError } = await supabase.rpc(
        "cc_get_session_secret_review_slideshow",
        {
          p_session_id: sessionId,
        },
      );
      if (!active || currentRequestId < latestAppliedRequestId) return;
      latestAppliedRequestId = currentRequestId;
      if (loadError) {
        setError(
          `The secret mission slideshow couldn't load: ${loadError.message}`,
        );
        return;
      }

      const nextView = data as SecretSlideshowView | null;
      if (!nextView) {
        setView(null);
        return;
      }
      setError("");
      if (nextView.evidence_id !== lastHostEvidenceId.current) {
        lastHostEvidenceId.current = nextView.evidence_id;
        const selectedIndex = nextView.items.findIndex(
          (item) => item.id === nextView.evidence_id,
        );
        setCurrentIndex(selectedIndex >= 0 ? selectedIndex : 0);
      } else {
        setCurrentIndex((index) =>
          Math.min(index, Math.max(0, nextView.items.length - 1)),
        );
      }
      setView(nextView);
    };

    void refresh();
    const interval = window.setInterval(() => void refresh(), 1500);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [sessionId]);

  const items = view?.items ?? [];
  const currentItem = items[currentIndex] ?? null;

  useEffect(() => setMediaError(""), [currentItem?.id]);

  useEffect(() => {
    if (!view?.open || items.length < 2 || !currentItem) return;
    const timer = window.setTimeout(
      () => setCurrentIndex((index) => (index + 1) % items.length),
      currentItem.media_type === "video" ? 15_000 : 6_000,
    );
    return () => window.clearTimeout(timer);
  }, [
    currentIndex,
    currentItem?.id,
    currentItem?.media_type,
    items.length,
    view?.open,
  ]);

  async function enterFullscreen() {
    try {
      await document.documentElement.requestFullscreen();
    } catch (fullscreenError) {
      setError(
        fullscreenError instanceof Error
          ? `Couldn't enter fullscreen: ${fullscreenError.message}`
          : "Couldn't enter fullscreen.",
      );
    }
  }

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
        src={mediaUrl(currentItem.storage_path)}
        alt={`Evidence for ${view.mission.title}`}
        onEnded={() => setCurrentIndex((index) => (index + 1) % items.length)}
        onError={setMediaError}
      />
      <SlideshowCaption
        kicker={<>SECRET MISSION · {view.mission.title}</>}
        title={view.mission.player_name}
      />
    </SlideshowScreen>
  );
}
