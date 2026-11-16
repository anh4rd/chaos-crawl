import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  submitChallenge,
  type ChallengeSubmission,
  type UploadChallenge,
} from "../../lib/challengeSubmission";
import type {
  ChallengeCompletion,
  ChallengeType,
  Player,
} from "../../types/database";
export type { UploadChallenge } from "../../lib/challengeSubmission";

function keyFor(playerId: string, type: ChallengeType, id: string | number) {
  return JSON.stringify([playerId, type, String(id)]);
}

function asError(error: unknown) {
  return error instanceof Error
    ? error
    : new Error("Could not save challenge. Please try again.");
}

/** Owns the optimistic and media lifecycle for one selected participant. */
export function useChallengeParticipation(
  player: Player | undefined,
  pub: string,
  completions: ChallengeCompletion[],
) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingUpload = useRef<ChallengeSubmission | null>(null);
  const pending = useRef(new Set<string>());
  const busy = useRef(false);
  const mounted = useRef(true);
  const [, renderPending] = useState(0);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [completingKey, setCompletingKey] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    for (const row of completions) {
      pending.current.delete(
        keyFor(row.player_id, row.challenge_type, row.challenge_id),
      );
    }
  }, [completions]);

  function completionKey(type: ChallengeType, id: string | number) {
    return keyFor(player?.id ?? "", type, id);
  }

  function hasCompleted(type: ChallengeType, id: string | number) {
    return Boolean(
      player &&
      (pending.current.has(completionKey(type, id)) ||
        completions.some(
          (row) =>
            row.player_id === player.id &&
            row.challenge_type === type &&
            String(row.challenge_id) === String(id),
        )),
    );
  }

  function updatePending(key: string, add: boolean) {
    if (add) pending.current.add(key);
    else pending.current.delete(key);
    if (mounted.current) renderPending((value) => value + 1);
  }

  async function submit(selection: ChallengeSubmission, file?: File) {
    const { player: actor, challenge } = selection;
    const key = keyFor(actor.id, challenge.type, challenge.id);
    busy.current = true;
    setError(null);
    if (file) setUploadingKey(key);
    else setCompletingKey(key);
    try {
      await submitChallenge(selection, file, () => updatePending(key, true));
    } catch (failure) {
      updatePending(key, false);
      if (mounted.current) setError(asError(failure));
    } finally {
      busy.current = false;
      if (mounted.current) {
        setCompletingKey(null);
        setUploadingKey(null);
      }
    }
  }

  async function complete(
    type: ChallengeType,
    id: string | number,
    points: number,
  ) {
    if (busy.current || hasCompleted(type, id)) return;
    if (!player) {
      setError(new Error("Player session not found. Please rejoin."));
      return;
    }
    await submit({ player, pub, challenge: { type, id, points, title: "" } });
  }

  function chooseUpload(challenge: UploadChallenge) {
    if (busy.current || hasCompleted(challenge.type, challenge.id)) return;
    if (!player) {
      setError(new Error("Player session not found. Please rejoin."));
      return;
    }
    // Capture the actor now: changing the host's selected participant while the
    // picker is open must not attribute the selected file to another player.
    pendingUpload.current = { challenge, player, pub };
    fileInputRef.current?.click();
  }

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    const selection = pendingUpload.current;
    pendingUpload.current = null;
    if (!file || !selection || busy.current) {
      input.value = "";
      return;
    }
    try {
      await submit(selection, file);
    } finally {
      input.value = "";
    }
  }

  return {
    fileInputRef,
    uploadingKey,
    completingKey,
    error,
    completionKey,
    hasCompleted,
    complete,
    chooseUpload,
    handleFileSelected,
  };
}
