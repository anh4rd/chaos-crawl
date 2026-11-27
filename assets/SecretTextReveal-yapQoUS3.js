var e=`import { useEffect, useState } from "react";
import SlideshowMessage from "../../components/slideshow/SlideshowMessage";
import Note from "../../components/ui/Note";
import Overline from "../../components/ui/Overline";

export default function SecretTextReveal({
  mission,
  answer,
}: {
  mission: { title: string; description: string; player_name: string };
  answer: string;
}) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setRevealed(true), 5000);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <SlideshowMessage>
      <Overline variant="slideshow-waiting">
        SECRET MISSION · {mission.player_name}
      </Overline>
      <h1>{mission.title}</h1>
      <Note variant="slideshow-copy">{mission.description}</Note>
      {revealed ? (
        <strong className="slideshow-message__answer">{answer}</strong>
      ) : (
        <strong>Answer coming up…</strong>
      )}
    </SlideshowMessage>
  );
}
`;export{e as default};