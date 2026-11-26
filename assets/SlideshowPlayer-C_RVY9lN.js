var e=`import type { Media } from "../../types/database";
import SlideshowView from "./SlideshowView";
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
  return (
    <SlideshowView
      current={current}
      currentIndex={playback.currentIndex}
      itemCount={media.length}
      paused={playback.paused}
      isHost={isHost}
      ending={ending}
      end={end}
      reload={reload}
      previous={playback.previous}
      next={playback.next}
      togglePaused={playback.togglePaused}
      slide={
        current ? (
          <MediaSlide
            key={\`\${current.id}:\${current.image_url}:\${current.media_type}\`}
            media={current}
            paused={playback.paused}
            next={playback.next}
          />
        ) : null
      }
    />
  );
}
`;export{e as default};