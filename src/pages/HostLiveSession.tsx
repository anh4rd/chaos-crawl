import { useParams } from "react-router-dom";
import HostSession from "../features/host-live/HostSession";

export default function HostLiveSession() {
  const { sessionId = "" } = useParams();
  return <HostSession key={sessionId} sessionId={sessionId} />;
}
