import { useState } from "react";

import { demoTeams } from "../data/demo";

export function useGameStore() {
  const [playerName, setPlayerName] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");

  return {
    teams: demoTeams,

    playerName,
    setPlayerName,

    selectedTeamId,
    setSelectedTeamId,
  };
}