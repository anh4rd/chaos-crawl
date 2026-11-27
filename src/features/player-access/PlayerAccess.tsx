import PlayerAccessView from "./PlayerAccessView";
import { usePlayerAccess } from "./usePlayerAccess";
import type { JoinMode } from "./types";
import type { JoinResult } from "../../types/playerAccess";
import RecoverySetup from "./RecoverySetup";

export default function PlayerAccess(props: {
  codeFromUrl: string;
  initialMode: JoinMode;
  onJoined: (result: JoinResult) => void;
}) {
  const { access, setup } = usePlayerAccess(props);
  if (setup) return <RecoverySetup {...setup} setupError={access.error} />;
  return <PlayerAccessView {...access} />;
}
