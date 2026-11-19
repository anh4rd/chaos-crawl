import { useRef, useState } from "react";
import { createLegacyAdminTeam } from "../../../lib/legacyAdminCommands";
import { changeTeam } from "../../../lib/playerApi";

import { useAdminLifetime } from "../useAdminLifetime";
export function useTeamManagement({
  reloadTeams,
  reloadPlayers,
}: {
  reloadTeams: () => Promise<void>;
  reloadPlayers: () => Promise<void>;
}) {
  const captureLifetime = useAdminLifetime();
  const [newTeamName, setNewTeamName] = useState("");
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [assigningPlayerIds, setAssigningPlayerIds] = useState<Set<string>>(
    () => new Set(),
  );
  const pendingAssignments = useRef(new Set<string>());
  const creating = useRef(false);
  async function createTeam() {
    const current = captureLifetime();
    const name = newTeamName.trim();
    if (!current() || !name || creating.current) return;
    creating.current = true;
    setCreatingTeam(true);
    try {
      const { error } = await createLegacyAdminTeam(name);
      if (!current()) return;
      if (error) {
        alert(`Could not create team: ${error.message}`);
        return;
      }
      setNewTeamName("");
      await reloadTeams();
    } catch (cause) {
      if (!current()) return;
      alert(
        `Could not create team: ${cause instanceof Error ? cause.message : "Unexpected error"}`,
      );
    } finally {
      if (current()) {
        creating.current = false;
        setCreatingTeam(false);
      }
    }
  }
  async function assignTeam(playerId: string, teamName: string) {
    const current = captureLifetime();
    if (!current() || pendingAssignments.current.has(playerId)) return;
    pendingAssignments.current.add(playerId);
    setAssigningPlayerIds(new Set(pendingAssignments.current));
    try {
      const { error } = await changeTeam(playerId, teamName);
      if (!current()) return;
      if (error) {
        alert(`Could not assign team: ${error.message}`);
        return;
      }
      await reloadPlayers();
    } catch (cause) {
      if (!current()) return;
      alert(
        `Could not assign team: ${cause instanceof Error ? cause.message : "Unexpected error"}`,
      );
    } finally {
      if (current()) {
        pendingAssignments.current.delete(playerId);
        setAssigningPlayerIds(new Set(pendingAssignments.current));
      }
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
