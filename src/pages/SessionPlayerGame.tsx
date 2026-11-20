import { useParams } from "react-router-dom";
import SessionParticipant from "../features/session-player/SessionParticipant";
import type { PlayerPage } from "../features/session-player/types";

export default function SessionPlayerGame() {
  const { joinCode = "", page } = useParams();
  const section: PlayerPage =
    page === "leaderboard" ||
    page === "side-challenges" ||
    page === "final" ||
    page === "recap"
      ? page
      : "game";
  return (
    <SessionParticipant key={joinCode} joinCode={joinCode} section={section} />
  );
}
