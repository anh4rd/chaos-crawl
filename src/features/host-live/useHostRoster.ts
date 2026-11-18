import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState, type FormEvent } from "react";
import * as hostRosterCommands from "../../lib/hostRosterCommands";
import * as hostSessionCommands from "../../lib/hostSessionCommands";
import { gameAssetUrl } from "../../lib/sessionMedia";
import type { GameSession, SessionPlayer, SessionTeam } from "./types";
import type { SetHostBusy } from "./useHostOperation";

interface Options {
  teams: SessionTeam[];
  players: SessionPlayer[];
  session: GameSession | null;
  setBusy: SetHostBusy;
  setError: Dispatch<SetStateAction<string>>;
  setNotice: Dispatch<SetStateAction<string>>;
  setSession: Dispatch<SetStateAction<GameSession | null>>;
  load: () => Promise<void>;
  setTeamPhotoUrls: Dispatch<SetStateAction<Record<string, string>>>;
}
export function useHostRoster({
  teams,
  players,
  session,
  setBusy,
  setError,
  setNotice,
  setSession,
  load,
  setTeamPhotoUrls,
}: Options) {
  const [teamName, setTeamName] = useState("");

  const [selectedLobbyPlayerId, setSelectedLobbyPlayerId] = useState("");

  const [teamNameEdits, setTeamNameEdits] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    setTeamNameEdits((current) =>
      Object.fromEntries(
        teams.map((team) => [team.id, current[team.id] ?? team.name]),
      ),
    );
    if (!players.some((player) => player.id === selectedLobbyPlayerId)) {
      const nextPlayer =
        players.find((player) => !player.team_id) ?? players[0];
      setSelectedLobbyPlayerId(nextPlayer?.id ?? "");
    }
  }, [players, selectedLobbyPlayerId, teams]);

  async function updatePlayersPerTeam(size: number) {
    if (!session || !Number.isFinite(size)) return;
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const { error: sizeError } = await hostRosterCommands.updateTeamCapacity(
      { team_size: size },
      session.id,
    );
    setBusy(false);
    if (sizeError) {
      setError(sizeError.message);
      return;
    }
    setSession({ ...session, team_size: size });
    setNotice(`Team capacity updated to ${size} players.`);
    await load();
  }

  async function createTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = teamName.trim();
    if (!session || !cleanName) return;
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const { error: createError } = await hostRosterCommands.insertSessionTeam({
      session_id: session.id,
      name: cleanName,
    });
    setBusy(false);
    if (createError) {
      setError(
        createError.message.includes("unique")
          ? "That team name is already used in this game."
          : createError.message,
      );
      return;
    }
    setTeamName("");
    setNotice(`Team "${cleanName}" created.`);
    await load();
  }

  async function renameTeam(team: SessionTeam) {
    const name = (teamNameEdits[team.id] ?? team.name).trim();
    if (!session || !name || name === team.name) return;
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const { error: renameError } = await hostRosterCommands.renameSessionTeam(
      { name },
      team.id,
      session.id,
    );
    setBusy(false);
    if (renameError) {
      setError(renameError.message);
      return;
    }
    setNotice(`Team renamed to ${name}.`);
    await load();
  }

  async function uploadTeamPhoto(team: SessionTeam, file: File) {
    if (!session?.host_game_id) {
      setError(
        "This game is not linked to a saved plan, so team photos cannot be saved.",
      );
      return;
    }
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const extension =
      file.name
        .split(".")
        .pop()
        ?.replace(/[^a-z0-9]/gi, "") || "jpg";
    const path = `team-photos/${session.id}/${team.id}-${Date.now()}.${extension}`;
    const { error: uploadError } = await hostRosterCommands.uploadTeamImage(
      path,
      file,
      { upsert: true, contentType: file.type },
    );
    if (uploadError) {
      setBusy(false);
      setError(uploadError.message);
      return;
    }
    const url = gameAssetUrl(path);
    const { data: gameData, error: gameError } =
      await hostSessionCommands.readOwnedHostPlan(
        session.host_game_id,
        session.host_id,
      );
    if (gameError) {
      setBusy(false);
      setError(gameError.message);
      return;
    }
    const planData = (gameData?.plan_data ?? {}) as Record<string, unknown>;
    const previousPhotos = (planData.teamPhotoUrls ?? {}) as Record<
      string,
      string
    >;
    const { error: saveError } = await hostRosterCommands.saveTeamPhoto(
      {
        plan_data: {
          ...planData,
          teamPhotoUrls: { ...previousPhotos, [team.id]: url },
        },
      },
      session.host_game_id,
      session.host_id,
    );
    setBusy(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setTeamPhotoUrls((photos) => ({ ...photos, [team.id]: url }));
    setNotice(`Photo saved for ${team.name}.`);
  }

  async function assignTeam(player: SessionPlayer, teamId: string) {
    if (!session) return;
    if (teamId) {
      const count = players.filter(
        (person) => person.team_id === teamId && person.id !== player.id,
      ).length;
      if (count >= session.team_size) {
        setError(
          "That team is full. Increase team size in the game plan or choose another team.",
        );
        return;
      }
    }
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const { error: assignError } = await hostRosterCommands.assignSessionTeam(
      { team_id: teamId || null },
      player.id,
      session.id,
    );
    setBusy(false);
    if (assignError) {
      setError(assignError.message);
      return;
    }
    await load();
  }
  return {
    teamName,
    setTeamName,
    selectedLobbyPlayerId,
    setSelectedLobbyPlayerId,
    teamNameEdits,
    setTeamNameEdits,
    updatePlayersPerTeam,
    createTeam,
    renameTeam,
    uploadTeamPhoto,
    assignTeam,
  };
}
