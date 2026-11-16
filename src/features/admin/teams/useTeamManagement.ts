import { useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { changeTeam } from "../../../lib/playerApi";

export function useTeamManagement({
  reloadTeams,
  reloadPlayers,
}: {
  reloadTeams: () => Promise<void>;
  reloadPlayers: () => Promise<void>;
}) {
  const [newTeamName, setNewTeamName] = useState("");
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [assigningPlayerId, setAssigningPlayerId] = useState<string | null>(
    null,
  );
  const creating = useRef(false);
  async function createTeam() {
    const name = newTeamName.trim();
    if (!name || creating.current) return;
    creating.current = true;
    setCreatingTeam(true);
    try {
      const { error } = await supabase.from("teams").insert({ name });
      if (error) {
        alert(`Could not create team: ${error.message}`);
        return;
      }
      setNewTeamName("");
      await reloadTeams();
    } catch (cause) {
      alert(
        `Could not create team: ${cause instanceof Error ? cause.message : "Unexpected error"}`,
      );
    } finally {
      creating.current = false;
      setCreatingTeam(false);
    }
  }
  async function assignTeam(playerId: string, teamName: string) {
    setAssigningPlayerId(playerId);
    try {
      const { error } = await changeTeam(playerId, teamName);
      if (error) {
        alert(`Could not assign team: ${error.message}`);
        return;
      }
      await reloadPlayers();
    } catch (cause) {
      alert(
        `Could not assign team: ${cause instanceof Error ? cause.message : "Unexpected error"}`,
      );
    } finally {
      setAssigningPlayerId(null);
    }
  }
  return {
    newTeamName,
    setNewTeamName,
    creatingTeam,
    assigningPlayerId,
    createTeam,
    assignTeam,
  };
}
