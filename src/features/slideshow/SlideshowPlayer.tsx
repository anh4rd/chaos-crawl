import type { Media } from "../../types/database";
import Button from "../../components/ui/Button";
import MediaSlide from "./MediaSlide";
import { useSlideshowPlayback } from "./useSlideshowPlayback";

export default function SlideshowPlayer({
  media,
  isHost,
  ending,
  end,
  reload,
}: {
  media: Media[];
  isHost: boolean;
  ending: boolean;
  end: () => void;
  reload: () => Promise<void>;
}) {
  const playback = useSlideshowPlayback(media);
  const current = playback.current;
  const endButton = (
    <Button type="button" disabled={ending} onClick={end}>
      {ending ? "Ending..." : "End Slideshow"}
    </Button>
  );
  if (!current)
    return (
      <main className="relative flex min-h-screen items-center justify-center bg-black p-8 text-center text-white">
        <div>
          <h1 className="text-5xl font-bold">Anna&apos;s Chaos Crawl</h1>
          <p className="mt-6 text-2xl">Waiting for chaos...</p>
          <div className="mt-6">
            <Button type="button" onClick={() => void reload()}>
              Check for uploads
            </Button>
          </div>
        </div>
        {isHost && <div className="absolute right-6 top-6">{endButton}</div>}
      </main>
    );
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black">
      <MediaSlide
        key={`${current.id}:${current.image_url}:${current.media_type}`}
        media={current}
        paused={playback.paused}
        next={playback.next}
      />
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/70 p-6 text-white text-s">
        {current.pub && <p className="text-sm uppercase">📍 {current.pub}</p>}
        {current.challenge && (
          <h1 className="mt-1 text-3xl font-bold">{current.challenge}</h1>
        )}
        {current.player_name && (
          <p className="mt-2 text-xl">
            {current.player_name}
            {current.team ? ` • ${current.team}` : ""}
          </p>
        )}
      </div>
      <div
        aria-label="Slide counter"
        className="absolute left-6 top-6 z-20 rounded-xl bg-black/70 px-4 py-2 text-white"
      >
        {playback.currentIndex + 1} / {media.length}
      </div>
      {isHost && (
        <div className="absolute right-6 top-6 z-20 flex max-w-[70%] flex-wrap justify-end gap-2">
          <Button type="button" onClick={playback.previous}>
            ← Previous
          </Button>
          <Button type="button" onClick={playback.togglePaused}>
            {playback.paused ? "▶ Resume" : "⏸ Pause"}
          </Button>
          <Button type="button" onClick={playback.next}>
            Next →
          </Button>
          {endButton}
        </div>
      )}
      {playback.paused && (
        <div className="absolute right-6 top-24 z-20 rounded-xl bg-black/70 px-4 py-2 text-white">
          PAUSED
        </div>
      )}
    </main>
  );
}
