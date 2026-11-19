import { useEffect, useRef, useState } from "react";
import { useHostOperation } from "../host-live/useHostOperation";
import type { Player } from "../../types/database";
import { deletePlayer, renamePlayer } from "../../lib/playerApi";
import {
  createLegacyHostTeam,
  createLegacyHostPlayer,
  assignLegacyHostTeam,
} from "../../lib/legacyHostCommands";
import { apiError, type ApiResult } from "../../lib/apiResult";

export function useLegacyRoster(loadTeams: () => Promise<void>) {
  const [teamNameDraft, setTeamNameDraft] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");
  const { busy: creatingTeam, setBusy: setCreatingTeam } = useHostOperation();
  const { busy: creatingPlayer, setBusy: setCreatingPlayer } =
    useHostOperation();
  const mounted = useRef(false);
  const lifetime = useRef(0);
  const teamWrite = useRef(0);
  const playerWrite = useRef(0);
  const pendingPlayers = useRef(new Set<string>());
  useEffect(() => {
    const operations = pendingPlayers.current;
    mounted.current = true;
    lifetime.current += 1;
    return () => {
      mounted.current = false;
      operations.clear();
      setCreatingTeam(false);
      setCreatingPlayer(false);
    };
  }, [setCreatingTeam, setCreatingPlayer]);
  async function addTeam() {
    const name = teamNameDraft.trim();
    if (!mounted.current || !name || !setCreatingTeam(true)) return;
    const generation = lifetime.current;
    const write = ++teamWrite.current;
    const current = () =>
      mounted.current &&
      lifetime.current === generation &&
      teamWrite.current === write;
    try {
      const { error } = await createLegacyHostTeam(name);
      if (!current()) return;
      setCreatingTeam(false);
      if (error) {
        window.alert(`Could not create team: ${error.message}`);
        return;
      }
      setTeamNameDraft("");
      await loadTeams();
    } catch (error) {
      if (current())
        window.alert(`Could not create team: ${apiError(error).message}`);
    } finally {
      if (current()) setCreatingTeam(false);
    }
  }
  async function addPlayer() {
    const name = newPlayerName.trim();
    if (!mounted.current || !name || !setCreatingPlayer(true)) return;
    const generation = lifetime.current;
    const write = ++playerWrite.current;
    const current = () =>
      mounted.current &&
      lifetime.current === generation &&
      playerWrite.current === write;
    try {
      const { error } = await createLegacyHostPlayer(name);
      if (!current()) return;
      if (error) {
        window.alert(`Could not add player: ${error.message}`);
        return;
      }
      setNewPlayerName("");
    } catch (error) {
      if (current())
        window.alert(`Could not add player: ${apiError(error).message}`);
    } finally {
      if (current()) setCreatingPlayer(false);
    }
  }
  async function mutatePlayer(
    id: string,
    operation: () => Promise<ApiResult<null>>,
    failure: string,
  ) {
    if (!mounted.current || pendingPlayers.current.has(id)) return;
    const generation = lifetime.current;
    const current = () => mounted.current && lifetime.current === generation;
    pendingPlayers.current.add(id);
    try {
      const { error } = await operation();
      if (current() && error) window.alert(`${failure}: ${error.message}`);
    } catch (error) {
      if (current()) window.alert(`${failure}: ${apiError(error).message}`);
    } finally {
      if (current()) pendingPlayers.current.delete(id);
    }
  }
  async function assignTeam(player: Player, teamName: string) {
    await mutatePlayer(
      player.id,
      () => assignLegacyHostTeam(player.id, teamName),
      `Could not change ${player.name}'s team`,
    );
  }
  async function savePlayerName(player: Player, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === player.name) return;
    await mutatePlayer(
      player.id,
      () => renamePlayer(player.id, trimmed),
      "Could not rename player",
    );
  }
  async function removePlayer(player: Player) {
    if (!mounted.current || pendingPlayers.current.has(player.id)) return;
    if (!window.confirm(`Remove ${player.name} from this game?`)) return;
    await mutatePlayer(
      player.id,
      () => deletePlayer(player.id),
      "Could not remove player",
    );
  }
  return {
    teamNameDraft,
    setTeamNameDraft,
    newPlayerName,
    setNewPlayerName,
    creatingTeam,
    creatingPlayer,
    addTeam,
    addPlayer,
    assignTeam,
    savePlayerName,
    removePlayer,
  };
}
