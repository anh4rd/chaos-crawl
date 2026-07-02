import { useState } from "react";

export function useGame() {
  const [playerName, setPlayerName] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");

  return {
    playerName,
    setPlayerName,

    selectedTeam,
    setSelectedTeam,
  };
}