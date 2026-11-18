import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BallotView from "./BallotView";
import { clearPlayerId } from "../../lib/playerSession";
import type { Player, Team } from "../../types/database";
import { useBallot } from "./useBallot";

interface BallotProps {
  playerId: string | null;
  challenge: string;
  target: "player" | "team";
  players: Player[];
  teams: Team[];
  fromAdmin: boolean;
}
export default function Ballot({
  playerId,
  challenge,
  target,
  players,
  teams,
  fromAdmin,
}: BallotProps) {
  const [selection, setSelection] = useState<string | null>(null);
  const ballot = useBallot(playerId, challenge, target);
  const navigate = useNavigate();
  return (
    <BallotView
      challenge={challenge}
      target={target}
      players={players}
      teams={teams}
      fromAdmin={fromAdmin}
      selection={selection}
      setSelection={setSelection}
      ballot={ballot}
      onRejoin={() => {
        clearPlayerId();
        navigate("/legacy/join", { replace: true });
      }}
      onBack={() => navigate("/admin")}
    />
  );
}
