import { useParams } from "react-router-dom";
import SecretSlideshow from "../features/session-slideshow/SecretSlideshow";

export default function SessionSecretSlideshow() {
  const { sessionId = "" } = useParams();
  return <SecretSlideshow key={sessionId} sessionId={sessionId} />;
}
