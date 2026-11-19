import type { Dispatch, SetStateAction } from "react";
import { useState, type FormEvent } from "react";
import * as sessionParticipantCommands from "../../lib/sessionParticipantCommands";

interface Options {
  token: string | null;
  code: string;
  setBusyKey: Dispatch<SetStateAction<string | null>>;
  setError: Dispatch<SetStateAction<string>>;
  loadView: () => Promise<void>;
}
export function useParticipantTeams({
  token,
  code,
  setBusyKey,
  setError,
  loadView,
}: Options) {
  const [teamName, setTeamName] = useState("");

  async function chooseTeam(teamId: string) {
    if (!token || !code) return;
    setBusyKey(`team:${teamId}`);
    setError("");
    const { error: chooseError } =
      await sessionParticipantCommands.playerChooseSessionTeam({
        p_join_code: code,
        p_player_token: token,
        p_team_id: teamId,
      });
    setBusyKey(null);
    if (chooseError) {
      setError(chooseError.message);
      return;
    }
    await loadView();
  }

  async function createTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !code || !teamName.trim()) return;
    setBusyKey("create-team");
    setError("");
    const { error: createError } =
      await sessionParticipantCommands.playerCreateSessionTeam({
        p_join_code: code,
        p_player_token: token,
        p_team_name: teamName.trim(),
      });
    setBusyKey(null);
    if (createError) {
      setError(createError.message);
      return;
    }
    setTeamName("");
    await loadView();
  }
  return { teamName, setTeamName, chooseTeam, createTeam };
}
