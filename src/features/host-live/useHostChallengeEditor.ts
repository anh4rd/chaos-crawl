import type { PlannedTaskInfo } from "../../types/hostSession";
import type { Dispatch, SetStateAction } from "react";
import { useState, type FormEvent } from "react";
import * as hostSessionCommands from "../../lib/hostSessionCommands";
import {
  patchLiveHostPlanTask,
  plannedTaskForChallenge,
} from "./liveHostPlanData";
import type { GameSession, SessionChallenge } from "./types";
import type { SetHostBusy } from "./useHostOperation";

interface Options {
  nextBreakChallenge: SessionChallenge | undefined;
  nextBreakTask: PlannedTaskInfo | undefined;
  plannedTasks: PlannedTaskInfo[];
  challenges: SessionChallenge[];
  session: GameSession | null;
  setBusy: SetHostBusy;
  setError: Dispatch<SetStateAction<string>>;
  setNotice: Dispatch<SetStateAction<string>>;
  setPlannedTasks: Dispatch<SetStateAction<PlannedTaskInfo[]>>;
  load: () => Promise<void>;
}
export function useHostChallengeEditor({
  nextBreakChallenge,
  nextBreakTask,
  plannedTasks,
  challenges,
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

  const [editChallengeSetup, setEditChallengeSetup] = useState("");

  const [editChallengePrep, setEditChallengePrep] = useState("");

  const [editChallengeDuration, setEditChallengeDuration] = useState(15);

  const [editChallengePoints, setEditChallengePoints] = useState(10);

  const [editChallengeEvidence, setEditChallengeEvidence] = useState(false);

  function plannedTaskFor(challenge: SessionChallenge) {
    return (
      plannedTaskForChallenge(plannedTasks, challenge, challenges) ??
      (nextBreakChallenge?.id === challenge.id ? nextBreakTask : undefined)
    );
  }

  function openBreakChallengeEditor(challenge: SessionChallenge) {
    const plannedTask = plannedTaskFor(challenge);
    setEditingBreakChallenge(challenge);
    setEditChallengeTitle(challenge.title);
    setEditChallengeDescription(challenge.description);
    setEditChallengeEquipment((plannedTask?.equipment ?? []).join(", "));
    setEditChallengeSetup(plannedTask?.setup ?? "");
    setEditChallengePrep(plannedTask?.prep ?? "");
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
      await hostSessionCommands.saveBreakChallenge({
        values: {
          title: editChallengeTitle.trim(),
          description: editChallengeDescription.trim(),
          duration_minutes: Math.max(1, Number(editChallengeDuration) || 1),
          points: Math.max(0, Number(editChallengePoints) || 0),
          allow_photo_upload: editChallengeEvidence,
        },
        challengeId: editingBreakChallenge.id,
        sessionId: session.id,
      });
    if (challengeError) {
      setBusy(false);
      setError(`Couldn't update this challenge: ${challengeError.message}`);
      return;
    }
    const editingTask = plannedTaskFor(editingBreakChallenge);
    let saveError = "";
    if (session.host_game_id && editingTask?.id) {
      const { data: gameData, error: readError } =
        await hostSessionCommands.readHostPlan(session.host_game_id);
      const update = readError
        ? null
        : patchLiveHostPlanTask(gameData?.plan_data, editingTask.id, {
            title: editChallengeTitle.trim(),
            description: editChallengeDescription.trim(),
            minutes: Math.max(1, Number(editChallengeDuration) || 1),
            points: Math.max(0, Number(editChallengePoints) || 0),
            equipment,
            setup: editChallengeSetup.trim(),
            prep: editChallengePrep.trim(),
          });
      if (!update) {
        saveError =
          "Challenge updated for this game. Its saved plan details could not be updated.";
      } else {
        const { error: planError } =
          await hostSessionCommands.saveHostPlanTasks({
            values: { plan_data: update.planData },
            hostGameId: session.host_game_id,
            hostId: session.host_id,
          });
        if (planError)
          saveError =
            "Challenge updated for this game. Its saved plan details could not be updated.";
        else setPlannedTasks(update.plannedTasks);
      }
    }
    setBusy(false);
    if (saveError) setError(saveError);
    else setNotice(`Round ${editingBreakChallenge.round_number} updated.`);
    setEditingBreakChallenge(null);
    await load();
  }
  return {
    editingBreakChallenge,
    canEditEquipment: Boolean(
      session?.host_game_id &&
      editingBreakChallenge &&
      plannedTaskFor(editingBreakChallenge)?.id,
    ),
    setEditingBreakChallenge,
    editChallengeTitle,
    setEditChallengeTitle,
    editChallengeDescription,
    setEditChallengeDescription,
    editChallengeEquipment,
    setEditChallengeEquipment,
    editChallengeSetup,
    setEditChallengeSetup,
    editChallengePrep,
    setEditChallengePrep,
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
