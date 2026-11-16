import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Expand, LoaderCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
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
  return supabase.storage.from("session-evidence").getPublicUrl(storagePath).data.publicUrl;
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
      const { data, error: loadError } = await supabase.rpc("cc_get_session_secret_review_slideshow", {
        p_session_id: sessionId,
      });
      if (!active || currentRequestId < latestAppliedRequestId) return;
      latestAppliedRequestId = currentRequestId;
      if (loadError) {
        setError(`The secret mission slideshow couldn't load: ${loadError.message}`);
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
        const selectedIndex = nextView.items.findIndex((item) => item.id === nextView.evidence_id);
        setCurrentIndex(selectedIndex >= 0 ? selectedIndex : 0);
      } else {
        setCurrentIndex((index) => Math.min(index, Math.max(0, nextView.items.length - 1)));
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
    const timer = window.setTimeout(() => setCurrentIndex((index) => (index + 1) % items.length), currentItem.media_type === "video" ? 15_000 : 6_000);
    return () => window.clearTimeout(timer);
  }, [currentIndex, currentItem?.id, currentItem?.media_type, items.length, view?.open]);

  async function enterFullscreen() {
    try {
      await document.documentElement.requestFullscreen();
    } catch (fullscreenError) {
      setError(fullscreenError instanceof Error ? `Couldn't enter fullscreen: ${fullscreenError.message}` : "Couldn't enter fullscreen.");
    }
  }

  if (error && !view) {
    return <main className="cc-final-tv"><p className="cc-final-tv-error" role="alert">{error}</p></main>;
  }
  if (!view) {
    return <main className="cc-final-tv"><div className="cc-final-tv-waiting"><LoaderCircle className="cc-spin" size={28}/><span>Connecting to the secret mission slideshow…</span></div></main>;
  }
  if (!view.open || !view.mission) {
    return <main className="cc-final-tv"><div className="cc-final-tv-waiting"><span className="cc-final-tv-kicker">SECRET MISSION</span><h1>Slideshow is waiting</h1><p>The host will open a mission review.</p></div></main>;
  }
  if (!currentItem) {
    return <main className="cc-final-tv" aria-live="polite">
      <div className="cc-final-tv-waiting">
        <span className="cc-final-tv-kicker">SECRET MISSION · {view.mission.player_name}</span>
        <h1>{view.mission.title}</h1>
        <p>{view.mission.description}</p>
        <strong>No photo or video submitted</strong>
      </div>
      <button className="cc-final-tv-fullscreen" type="button" onClick={() => void enterFullscreen()} aria-label="Enter fullscreen"><Expand size={18}/></button>
      {error && <p className="cc-final-tv-live-error" role="status">{error}</p>}
    </main>;
  }

  return (
    <main className="cc-final-tv" aria-live="polite">
      {currentItem.media_type === "video"
        ? <video key={currentItem.id} className="cc-final-tv-media" src={mediaUrl(currentItem.storage_path)} autoPlay muted playsInline onEnded={() => setCurrentIndex((index) => (index + 1) % items.length)} onError={() => setMediaError("This video couldn't play on the TV screen.")}/>
        : <img className="cc-final-tv-media" src={mediaUrl(currentItem.storage_path)} alt={`Evidence for ${view.mission.title}`} onError={() => setMediaError("This photo couldn't load on the TV screen.")}/>}
      <div className="cc-final-tv-caption">
        <span className="cc-final-tv-kicker">SECRET MISSION · {view.mission.title}</span>
        <h1>{view.mission.player_name}</h1>
      </div>
      <span className="cc-final-tv-counter">{currentIndex + 1} / {items.length}</span>
      <button className="cc-final-tv-fullscreen" type="button" onClick={() => void enterFullscreen()} aria-label="Enter fullscreen"><Expand size={18}/></button>
      {(error || mediaError) && <p className="cc-final-tv-live-error" role="status">{error || mediaError}</p>}
    </main>
  );
}
