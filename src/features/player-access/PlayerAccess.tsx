import PlayerAccessView from "./PlayerAccessView";
import { usePlayerAccess } from "./usePlayerAccess";
import type { JoinMode } from "./types";
import type { JoinResult } from "../../types/playerAccess";
import "../../styles/PlayerGame.css";

export default function PlayerAccess(props: {
  codeFromUrl: string;
  initialMode: JoinMode;
  onJoined: (result: JoinResult) => void;
}) {
  const access = usePlayerAccess(props);
  return <PlayerAccessView {...access} />;
}
