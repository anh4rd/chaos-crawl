import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Icon from "../components/ui/Icon";
import { supabase } from "../lib/sessionSupabase";
import "../styles/PlayerGame.css";

interface FinalSlideshowItem {
  id: string;
  player_name: string;
  challenge_id: string;
  challenge_title: string;
  media_type: "image" | "video";
  storage_path: string;
}

interface FinalSlideshowView {
  open: boolean;
  challenge_id: string | null;
  evidence_id: string | null;
  items: FinalSlideshowItem[];
}

function mediaUrl(storagePath: string) {
  return supabase.storage.from("session-evidence").getPublicUrl(storagePath)
    .data.publicUrl;
}

export default function SessionFinalSlideshow() {
  const { sessionId = "" } = useParams();
  const [view, setView] = useState<FinalSlideshowView | null>(null);
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
        "cc_get_session_final_slideshow",
        {
          p_session_id: sessionId,
        },
      );
      if (!active || currentRequestId < latestAppliedRequestId) return;
      latestAppliedRequestId = currentRequestId;
      if (loadError) {
        setError(`The TV slideshow couldn't load: ${loadError.message}`);
        return;
      }

      const nextView = data as FinalSlideshowView | null;
      if (!nextView) {
        setView(null);
        return;
      }
      setError("");
      if (nextView.evidence_id !== lastHostEvidenceId.current) {
        lastHostEvidenceId.current = nextView.evidence_id;
        const hostSelectedIndex = nextView.items.findIndex(
          (item) => item.id === nextView.evidence_id,
        );
        setCurrentIndex(hostSelectedIndex >= 0 ? hostSelectedIndex : 0);
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

  useEffect(() => {
    setMediaError("");
  }, [currentItem?.id]);

  useEffect(() => {
    if (!view?.open || items.length < 2 || !currentItem) return;
    const timer = window.setTimeout(
      () => {
        setCurrentIndex((index) => (index + 1) % items.length);
      },
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
      <main className="cc-final-tv">
        <p className="cc-final-tv-error" role="alert">
          {error}
        </p>
      </main>
    );
  }

  if (!view) {
    return (
      <main className="cc-final-tv">
        <div className="cc-final-tv-waiting">
          <Icon name="loader-circle" className="icon--size-28 cc-spin" />
          <span>Connecting to the final slideshow…</span>
        </div>
      </main>
    );
  }

  if (!view.open) {
    return (
      <main className="cc-final-tv">
        <div className="cc-final-tv-waiting">
          <span className="cc-final-tv-kicker">FINAL ROUND</span>
          <h1>Slideshow is waiting</h1>
          <p>The host will open the final round and choose a side challenge.</p>
        </div>
      </main>
    );
  }

  if (!currentItem) {
    return (
      <main className="cc-final-tv">
        <div className="cc-final-tv-waiting">
          <span className="cc-final-tv-kicker">FINAL ROUND</span>
          <h1>Waiting for submissions</h1>
          <p>
            Submitted photos and videos for the selected side challenge will
            appear here.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="cc-final-tv" aria-live="polite">
      {currentItem.media_type === "video" ? (
        <video
          key={currentItem.id}
          className="cc-final-tv-media"
          src={mediaUrl(currentItem.storage_path)}
          autoPlay
          muted
          playsInline
          onEnded={() => setCurrentIndex((index) => (index + 1) % items.length)}
          onError={() =>
            setMediaError("This video couldn't play on the TV screen.")
          }
        />
      ) : (
        <img
          className="cc-final-tv-media"
          src={mediaUrl(currentItem.storage_path)}
          alt={`${currentItem.player_name}'s entry for ${currentItem.challenge_title}`}
          onError={() =>
            setMediaError("This photo couldn't load on the TV screen.")
          }
        />
      )}
      <div className="cc-final-tv-caption">
        <span className="cc-final-tv-kicker">
          {currentItem.challenge_title}
        </span>
        <h1>{currentItem.player_name}</h1>
      </div>
      <span className="cc-final-tv-counter">
        {currentIndex + 1} / {items.length}
      </span>
      <button
        className="cc-final-tv-fullscreen"
        type="button"
        onClick={() => void enterFullscreen()}
        aria-label="Enter fullscreen"
      >
        <Icon name="expand" className="icon--size-18" />
      </button>
      {(error || mediaError) && (
        <p className="cc-final-tv-live-error" role="status">
          {error || mediaError}
        </p>
      )}
    </main>
  );
}
