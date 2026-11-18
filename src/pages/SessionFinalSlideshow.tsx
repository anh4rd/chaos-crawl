import { useParams } from "react-router-dom";
import FinalSlideshow from "../features/session-slideshow/FinalSlideshow";

export default function SessionFinalSlideshow() {
  const { sessionId = "" } = useParams();
  return <FinalSlideshow key={sessionId} sessionId={sessionId} />;
}
