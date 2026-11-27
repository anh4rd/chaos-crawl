import type { Dispatch, SetStateAction } from "react";
import { useState, type FormEvent } from "react";
import * as hostSecretCommands from "../../lib/hostSecretCommands";
import type { GameSession, SessionChallenge, SessionPlayer } from "./types";
import type { SetHostBusy } from "./useHostOperation";

interface Options {
  session: GameSession | null;
  setBusy: SetHostBusy;
  setError: Dispatch<SetStateAction<string>>;
  setNotice: Dispatch<SetStateAction<string>>;
  challenges: SessionChallenge[];
  load: () => Promise<void>;
  players: SessionPlayer[];
}
export function useHostSecretMissions({
  session,
  setBusy,
  setError,
  setNotice,
  challenges,
  load,
  players,
}: Options) {
  const [selectedSecretPlayerId, setSelectedSecretPlayerId] = useState("");

  const [selectedSecretChallengeId, setSelectedSecretChallengeId] =
    useState("");

  const [secretScheduleAt, setSecretScheduleAt] = useState("");

  const [newSecretTitle, setNewSecretTitle] = useState("");

  const [newSecretDescription, setNewSecretDescription] = useState("");

  const [newSecretEvidenceRequired, setNewSecretEvidenceRequired] =
    useState(false);
  const [newSecretTextAnswer, setNewSecretTextAnswer] = useState(false);

  async function createSecretChallenge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !newSecretTitle.trim()) return;
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const nextSortOrder =
      Math.max(0, ...challenges.map((item) => Number(item.sort_order ?? 0))) +
      1;
    const { data, error: createError } =
      await hostSecretCommands.insertSecretChallenge({
        session_id: session.id,
        kind: "secret",
        round_number: null,
        title: newSecretTitle.trim(),
        description: newSecretDescription.trim(),
        points: session.secret_mission_points,
        duration_minutes: 10,
        sort_order: nextSortOrder,
        allow_photo_upload: !newSecretTextAnswer && newSecretEvidenceRequired,
        secret_response_mode: newSecretTextAnswer ? "text" : "media",
      });
    setBusy(false);
    if (createError || !data) {
      setError(createError?.message ?? "Couldn't add that secret mission.");
      return;
    }
    setNewSecretTitle("");
    setNewSecretDescription("");
    setNewSecretEvidenceRequired(false);
    setNewSecretTextAnswer(false);
    setSelectedSecretChallengeId(data.id);
    setNotice(
      "Secret mission added. Choose a player and send it now or schedule it.",
    );
    await load();
  }

  async function assignSecretMission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !selectedSecretPlayerId || !selectedSecretChallengeId) {
      setError("Choose one player and one secret mission.");
      return;
    }
    if (session.status === "completed") {
      setError("This game has finished.");
      return;
    }
    let scheduledAt: string;
    if (secretScheduleAt) {
      const when = new Date(secretScheduleAt);
      if (Number.isNaN(when.getTime())) {
        setError("Choose a valid delivery date and time.");
        return;
      }
      scheduledAt = when.toISOString();
    } else {
      scheduledAt = new Date().toISOString();
    }
    const targetPlayer = players.find(
      (item) => item.id === selectedSecretPlayerId,
    );
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const { error: assignError } =
      await hostSecretCommands.hostAssignSecretMission({
        p_session_id: session.id,
        p_player_id: selectedSecretPlayerId,
        p_challenge_id: selectedSecretChallengeId,
        p_scheduled_at: scheduledAt,
      });
    setBusy(false);
    if (assignError) {
      setError(assignError.message);
      return;
    }
    setSecretScheduleAt("");
    const isFuture =
      new Date(scheduledAt).getTime() > Date.now() && session.status === "live";
    setNotice(
      isFuture
        ? `Secret mission scheduled for ${targetPlayer?.name ?? "the player"} at ${new Date(scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
        : `Secret mission ${session.status === "live" ? "sent" : "queued for the start of the game"} to ${targetPlayer?.name ?? "the player"}.`,
    );
    await load();
  }

  async function rescheduleSecretMission(
    assignmentId: string,
    localSchedule: string,
  ): Promise<boolean> {
    if (!session || session.status === "completed") return false;
    const scheduledDate = new Date(localSchedule);
    if (!localSchedule || Number.isNaN(scheduledDate.getTime())) {
      setError("Choose a valid delivery date and time.");
      return false;
    }
    if (!setBusy(true)) return false;
    setError("");
    setNotice("");
    const { data, error: scheduleError } =
      await hostSecretCommands.updateScheduledSecretMission({
        assignmentId,
        scheduledAt: scheduledDate.toISOString(),
        sessionId: session.id,
      });
    setBusy(false);
    if (scheduleError) {
      setError(
        `Couldn't update the secret mission schedule: ${scheduleError.message}`,
      );
      return false;
    }
    if (!data) {
      setError("This mission is no longer scheduled and can't be edited.");
      await load();
      return false;
    }
    setNotice("Secret mission delivery time updated.");
    await load();
    return true;
  }

  return {
    selectedSecretPlayerId,
    setSelectedSecretPlayerId,
    selectedSecretChallengeId,
    setSelectedSecretChallengeId,
    secretScheduleAt,
    setSecretScheduleAt,
    newSecretTitle,
    setNewSecretTitle,
    newSecretDescription,
    setNewSecretDescription,
    newSecretEvidenceRequired,
    setNewSecretEvidenceRequired,
    newSecretTextAnswer,
    setNewSecretTextAnswer,
    createSecretChallenge,
    assignSecretMission,
    rescheduleSecretMission,
  };
}
