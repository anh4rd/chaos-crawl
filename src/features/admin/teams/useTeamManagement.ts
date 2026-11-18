import { useRef, useState } from "react";
import { createLegacyAdminTeam } from "../../../lib/legacyAdminCommands";
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
  const [assigningPlayerIds, setAssigningPlayerIds] = useState<Set<string>>(
    () => new Set(),
  );
  const pendingAssignments = useRef(new Set<string>());
  const creating = useRef(false);
  async function createTeam() {
    const name = newTeamName.trim();
    if (!name || creating.current) return;
    creating.current = true;
    setCreatingTeam(true);
    try {
      const { error } = await createLegacyAdminTeam(name);
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
    if (pendingAssignments.current.has(playerId)) return;
    pendingAssignments.current.add(playerId);
    setAssigningPlayerIds(new Set(pendingAssignments.current));
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
      pendingAssignments.current.delete(playerId);
      setAssigningPlayerIds(new Set(pendingAssignments.current));
    }
  }
  return {
    newTeamName,
    setNewTeamName,
    creatingTeam,
    assigningPlayerIds,
    createTeam,
    assignTeam,
  };
}
