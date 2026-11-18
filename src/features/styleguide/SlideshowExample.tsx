import { useState } from "react";
import SlideshowScreen from "../../components/slideshow/SlideshowScreen";
import SlideshowMessage from "../../components/slideshow/SlideshowMessage";
import SlideshowEvidence from "../../components/slideshow/SlideshowEvidence";
import SlideshowCaption from "../../components/slideshow/SlideshowCaption";
import Button from "../../components/ui/Button";
import Note from "../../components/ui/Note";
import Overline from "../../components/ui/Overline";
import { Example } from "./Example";

export default function SlideshowExample() {
  const [mode, setMode] = useState<"evidence" | "waiting" | "empty">(
    "evidence",
  );
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(
    "This TV preview only changes local state.",
  );
  const player = index === 0 ? "Pat" : "Alex";
  return (
    <Example
      title="Shared TV slideshow"
      source="src/components/slideshow/"
      code={
        '<SlideshowScreen as="div" live counter={{ index: 0, total: 2 }} onFullscreen={onPreviewAction}>\n  <SlideshowEvidence id="sample" mediaType="image" src={resolvedUrl} alt="Sample entry" onEnded={onNext} onError={onError} />\n  <SlideshowCaption kicker="Team portrait" title="Pat" />\n</SlideshowScreen>'
      }
    >
      <Button
        type="button"
        variant="poster-secondary"
        fullWidth={false}
        aria-pressed={mode === "evidence"}
        onClick={() => setMode("evidence")}
      >
        Show sample evidence
      </Button>
      <Button
        type="button"
        variant="poster-secondary"
        fullWidth={false}
        aria-pressed={mode === "waiting"}
        onClick={() => setMode("waiting")}
      >
        Show sample waiting
      </Button>
      <Button
        type="button"
        variant="poster-secondary"
        fullWidth={false}
        aria-pressed={mode === "empty"}
        onClick={() => setMode("empty")}
      >
        Show sample empty mission
      </Button>
      <Button
        type="button"
        variant="poster-secondary"
        fullWidth={false}
        onClick={() => setIndex((current) => (current + 1) % 2)}
      >
        Next sample evidence
      </Button>
      <Button
        type="button"
        variant="poster-secondary"
        fullWidth={false}
        aria-pressed={Boolean(error)}
        onClick={() => setError(error ? "" : "Sample TV feedback")}
      >
        Toggle sample TV error
      </Button>
      <Note as="output">{notice}</Note>
      <SlideshowScreen
        as="div"
        live={mode !== "waiting"}
        counter={mode === "evidence" ? { index, total: 2 } : undefined}
        onFullscreen={
          mode !== "waiting"
            ? () => setNotice("Fullscreen action stays in this local preview.")
            : undefined
        }
        error={mode !== "waiting" ? error : undefined}
      >
        {mode === "evidence" ? (
          <>
            <SlideshowEvidence
              id={`sample-${index}`}
              mediaType="image"
              src={`${import.meta.env.BASE_URL}chaos-logo.png`}
              alt={`${player}'s sample entry for Team portrait`}
              onEnded={() => setIndex((current) => (current + 1) % 2)}
              onError={setError}
            />
            <SlideshowCaption kicker="Team portrait" title={player} />
          </>
        ) : (
          <SlideshowMessage>
            <Overline variant="slideshow-waiting">SECRET MISSION</Overline>
            <h1>
              {mode === "waiting" ? "Slideshow is waiting" : "Secret toast"}
            </h1>
            <Note variant="slideshow-copy">
              {mode === "waiting"
                ? "The host will open a mission review."
                : "Give a toast without being noticed."}
            </Note>
            {mode === "empty" && <strong>No photo or video submitted</strong>}
          </SlideshowMessage>
        )}
      </SlideshowScreen>
    </Example>
  );
}
