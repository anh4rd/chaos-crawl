import type { Dispatch, SetStateAction } from "react";
import { useState, type FormEvent } from "react";
import * as hostSessionCommands from "../../lib/hostSessionCommands";
import { patchLiveHostPlanTask } from "./liveHostPlanData";
import type { GameSession, PlannedTaskInfo, SessionChallenge } from "./types";
import type { SetHostBusy } from "./useHostOperation";

interface Options {
  nextBreakTask: PlannedTaskInfo | undefined;
  session: GameSession | null;
  setBusy: SetHostBusy;
  setError: Dispatch<SetStateAction<string>>;
  setNotice: Dispatch<SetStateAction<string>>;
  setPlannedTasks: Dispatch<SetStateAction<PlannedTaskInfo[]>>;
  load: () => Promise<void>;
}
export function useHostChallengeEditor({
  nextBreakTask,
  session,
  setBusy,
  setError,
  setNotice,
  setPlannedTasks,
  load,
}: Options) {
  const [editingBreakChallenge, setEditingBreakChallenge] =
    useState<SessionChallenge | null>(null);

  const [editChallengeTitle, setEditChallengeTitle] = useState("");

  const [editChallengeDescription, setEditChallengeDescription] = useState("");

  const [editChallengeEquipment, setEditChallengeEquipment] = useState("");

  const [editChallengeDuration, setEditChallengeDuration] = useState(15);

  const [editChallengePoints, setEditChallengePoints] = useState(10);

  const [editChallengeEvidence, setEditChallengeEvidence] = useState(false);

  function openBreakChallengeEditor(challenge: SessionChallenge) {
    setEditingBreakChallenge(challenge);
    setEditChallengeTitle(challenge.title);
    setEditChallengeDescription(challenge.description);
    setEditChallengeEquipment((nextBreakTask?.equipment ?? []).join(", "));
    setEditChallengeDuration(Math.max(1, challenge.duration_minutes || 15));
    setEditChallengePoints(Math.max(0, challenge.points || 0));
    setEditChallengeEvidence(challenge.allow_photo_upload);
  }

  async function saveBreakChallengeEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !editingBreakChallenge || !editChallengeTitle.trim())
      return;
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const equipment = editChallengeEquipment
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const { error: challengeError } =
      await hostSessionCommands.saveBreakChallenge(
        {
          title: editChallengeTitle.trim(),
          description: editChallengeDescription.trim(),
          duration_minutes: Math.max(1, Number(editChallengeDuration) || 1),
          points: Math.max(0, Number(editChallengePoints) || 0),
          allow_photo_upload: editChallengeEvidence,
        },
        editingBreakChallenge.id,
        session.id,
      );
    if (challengeError) {
      setBusy(false);
      setError(`Couldn't update this challenge: ${challengeError.message}`);
      return;
    }
    let saveNotice = `Round ${editingBreakChallenge.round_number} updated.`;
    if (session.host_game_id && nextBreakTask?.id) {
      const { data: gameData, error: readError } =
        await hostSessionCommands.readHostPlan(session.host_game_id);
      const update = readError
        ? null
        : patchLiveHostPlanTask(gameData?.plan_data, nextBreakTask.id, {
            title: editChallengeTitle.trim(),
            description: editChallengeDescription.trim(),
            minutes: Math.max(1, Number(editChallengeDuration) || 1),
            points: Math.max(0, Number(editChallengePoints) || 0),
            equipment,
          });
      if (!update) {
        saveNotice =
          "Challenge updated for this game. Its saved plan equipment could not be updated.";
      } else {
        const { error: planError } =
          await hostSessionCommands.saveHostPlanTasks(
            { plan_data: update.planData },
            session.host_game_id,
            session.host_id,
          );
        if (planError)
          saveNotice =
            "Challenge updated for this game. Its saved plan equipment could not be updated.";
        else setPlannedTasks(update.plannedTasks);
      }
    }
    setBusy(false);
    setNotice(saveNotice);
    setEditingBreakChallenge(null);
    await load();
  }
  return {
    editingBreakChallenge,
    setEditingBreakChallenge,
    editChallengeTitle,
    setEditChallengeTitle,
    editChallengeDescription,
    setEditChallengeDescription,
    editChallengeEquipment,
    setEditChallengeEquipment,
    editChallengeDuration,
    setEditChallengeDuration,
    editChallengePoints,
    setEditChallengePoints,
    editChallengeEvidence,
    setEditChallengeEvidence,
    openBreakChallengeEditor,
    saveBreakChallengeEdit,
  };
}
