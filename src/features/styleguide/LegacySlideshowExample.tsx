import { useState } from "react";
import type { Media } from "../../types/database";
import Button from "../../components/ui/Button";
import Note from "../../components/ui/Note";
import UnavailableUpload from "../../components/slideshow/UnavailableUpload";
import MediaSlide from "../slideshow/MediaSlide";
import SlideshowView from "../slideshow/SlideshowView";
import { Example } from "./Example";

const samples: Media[] = [
  {
    id: "sample-first",
    player_id: null,
    image_url: `${import.meta.env.BASE_URL}chaos-logo.png`,
    uploaded_at: "2030-01-01T12:00:00Z",
    media_type: "image",
    player_name: "Pat",
    team: "Ducks",
    challenge: "Team portrait",
    pub: "Sample pub",
    points: 0,
  },
  {
    id: "sample-second",
    player_id: null,
    image_url: `${import.meta.env.BASE_URL}chaos-logo.png`,
    uploaded_at: "2030-01-01T12:00:00Z",
    media_type: "image",
    player_name: "Alex",
    team: null,
    challenge: "Best entrance",
    pub: null,
    points: null,
  },
];

export default function LegacySlideshowExample() {
  const [mode, setMode] = useState<"playing" | "empty" | "unavailable">(
    "playing",
  );
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [host, setHost] = useState(true);
  const [ending, setEnding] = useState(false);
  const [notice, setNotice] = useState(
    "This preview has no global playback shortcuts or backend.",
  );
  const current = mode === "empty" ? null : samples[index];
  const next = () => {
    setIndex((value) => (value + 1) % samples.length);
    setMode("playing");
  };
  return (
    <Example
      title="Legacy slideshow playback"
      source="src/features/slideshow/SlideshowView.tsx + UploadCaption.tsx + src/components/slideshow/PlaybackControls.tsx"
      code={
        '<SlideshowView as="div" current={sample} currentIndex={0} itemCount={2} paused={false} isHost ending={false} slide={localMedia} end={onLocalEnd} reload={onLocalReload} previous={onPrevious} next={onNext} togglePaused={onToggle} />'
      }
    >
      <Button
        type="button"
        variant="poster-secondary"
        fullWidth={false}
        onClick={() => setMode("playing")}
      >
        Show sample uploads
      </Button>
      <Button
        type="button"
        variant="poster-secondary"
        fullWidth={false}
        onClick={() => setMode("empty")}
      >
        Show empty slideshow
      </Button>
      <Button
        type="button"
        variant="poster-secondary"
        fullWidth={false}
        onClick={() => setMode("unavailable")}
      >
        Show unavailable upload
      </Button>
      <label>
        <input
          type="checkbox"
          checked={host}
          onChange={(event) => setHost(event.target.checked)}
        />{" "}
        Show sample host controls
      </label>
      <label>
        <input
          type="checkbox"
          checked={ending}
          onChange={(event) => setEnding(event.target.checked)}
        />{" "}
        Sample end pending
      </label>
      <Note as="output">{notice}</Note>
      <SlideshowView
        as="div"
        current={current ?? null}
        currentIndex={index}
        itemCount={mode === "empty" ? 0 : samples.length}
        paused={paused}
        isHost={host}
        ending={ending}
        end={() => setNotice("Sample end action stays in this preview.")}
        reload={async () => {
          setMode("playing");
          setNotice("Sample uploads refreshed locally.");
        }}
        previous={() =>
          setIndex((value) => (value - 1 + samples.length) % samples.length)
        }
        next={next}
        togglePaused={() => setPaused((value) => !value)}
        slide={
          mode === "unavailable" ? (
            <UnavailableUpload next={next} />
          ) : current ? (
            <MediaSlide
              key={`${current.id}:${current.image_url}:${current.media_type}`}
              media={current}
              paused={paused}
              next={next}
            />
          ) : null
        }
      />
    </Example>
  );
}
