import { useEffect, useRef, useState } from "react";
import type { Media } from "../../types/database";
import Button from "../../components/ui/Button";

// The parent keys this component by upload identity, so load errors cannot leak
// into another slide and each video has one playback lifecycle.
export default function MediaSlide({
  media,
  paused,
  next,
}: {
  media: Media;
  paused: boolean;
  next: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let disposed = false;
    if (paused) element.pause();
    else {
      setPlaybackBlocked(false);
      void element.play().catch(() => {
        if (!disposed) setPlaybackBlocked(true);
      });
    }
    return () => {
      disposed = true;
      element.pause();
    };
  }, [paused, failed, media.media_type]);

  if (failed)
    return (
      <div className="max-w-md p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Could not load this upload</h2>
        <p className="mt-3 text-zinc-400">
          The file may be unavailable or use an unsupported format.
        </p>
        <div className="mt-6">
          <Button type="button" onClick={next}>
            Skip to next
          </Button>
        </div>
      </div>
    );
  return (
    <>
      {media.media_type === "video" ? (
        <video
          ref={video}
          src={media.image_url}
          className="h-screen w-screen object-contain"
          playsInline
          controls
          onEnded={() => {
            if (!paused) next();
          }}
          onError={() => setFailed(true)}
        />
      ) : (
        <img
          src={media.image_url}
          alt="Chaos Crawl upload"
          className="h-screen w-screen object-contain"
          onError={() => setFailed(true)}
        />
      )}
      {playbackBlocked && (
        <p role="status" className="absolute top-24 bg-black/70 p-3 text-white">
          Use the video controls to start playback.
        </p>
      )}
    </>
  );
}
