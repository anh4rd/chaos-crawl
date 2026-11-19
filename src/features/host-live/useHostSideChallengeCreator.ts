import type { Dispatch, SetStateAction } from "react";
import { useState, type FormEvent } from "react";
import * as hostSessionCommands from "../../lib/hostSessionCommands";
import type { GameSession, SessionChallenge } from "./types";
import type { SetHostBusy } from "./useHostOperation";

interface Options {
  session: GameSession | null;
  challenges: SessionChallenge[];
  busy: boolean;
  setBusy: SetHostBusy;
  setError: Dispatch<SetStateAction<string>>;
  setNotice: Dispatch<SetStateAction<string>>;
  load: () => Promise<void>;
}

export function useHostSideChallengeCreator({
  session,
  challenges,
  busy,
  setBusy,
  setError,
  setNotice,
  load,
}: Options) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState(5);
  const [duration, setDuration] = useState(10);

  function resetDraft() {
    setTitle("");
    setDescription("");
    setPoints(5);
    setDuration(10);
  }

  function openDialog() {
    if (!session || session.status === "completed") return;
    setError("");
    setNotice("");
    setDialogOpen(true);
  }

  function closeDialog() {
    if (busy) return;
    setDialogOpen(false);
    resetDraft();
    setError("");
  }

  async function createSideChallenge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !session ||
      session.status === "completed" ||
      !title.trim() ||
      !description.trim()
    )
      return;
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const sortOrder =
      Math.max(0, ...challenges.map((challenge) => challenge.sort_order)) + 1;
    const { data, error: createError } =
      await hostSessionCommands.insertSideChallenge({
        session_id: session.id,
        kind: "side",
        round_number: null,
        title: title.trim(),
        description: description.trim(),
        points: Math.min(10000, Math.max(0, Number(points) || 0)),
        duration_minutes: Math.min(240, Math.max(1, Number(duration) || 1)),
        sort_order: sortOrder,
        allow_photo_upload: true,
      });
    setBusy(false);
    if (createError || !data) {
      setError(createError?.message ?? "Couldn't add this side challenge.");
      return;
    }
    setDialogOpen(false);
    resetDraft();
    setNotice("Side challenge added.");
    await load();
  }

  return {
    dialogOpen,
    title,
    setTitle,
    description,
    setDescription,
    points,
    setPoints,
    duration,
    setDuration,
    openDialog,
    closeDialog,
    createSideChallenge,
  };
}
