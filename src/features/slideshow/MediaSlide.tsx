import { useEffect, useRef, useState } from "react";
import type { Media } from "../../types/database";
import UnavailableUpload from "../../components/slideshow/UnavailableUpload";
import Note from "../../components/ui/Note";

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

  if (failed) return <UnavailableUpload next={next} />;
  return (
    <>
      {media.media_type === "video" ? (
        <video
          ref={video}
          src={media.image_url}
          className="playback-media"
          playsInline
          controls
          onEnded={() => {
            if (!paused) next();
          }}
          onPlaying={() => setPlaybackBlocked(false)}
          onError={() => setFailed(true)}
        />
      ) : (
        <img
          src={media.image_url}
          alt="Chaos Crawl upload"
          className="playback-media"
          onError={() => setFailed(true)}
        />
      )}
      {playbackBlocked && (
        <Note role="status" variant="playback-notice">
          Use the video controls to start playback.
        </Note>
      )}
    </>
  );
}
