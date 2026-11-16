import { useCallback, useEffect, useRef, useState } from "react";
import { getMyVote, castVote } from "../../lib/voteApi";
import { clearPlayerId } from "../../lib/playerSession";

/** Mount one ballot per voter, challenge and target mode. */
export function useBallot(
  playerId: string | null,
  challenge: string,
  target: "player" | "team",
) {
  const [hasVoted, setHasVoted] = useState<boolean | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [sessionInvalid, setSessionInvalid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const active = useRef(false);
  const busy = useRef(false);
  const version = useRef(0);
  const submission = useRef<AbortController | null>(null);
  const isCurrent = useCallback(
    (request: number) => active.current && request === version.current,
    [],
  );

  const reload = useCallback(async () => {
    const request = ++version.current;
    setError(null);
    setHasVoted(null);
    if (!playerId) {
      setSessionInvalid(true);
      return;
    }
    try {
      const result = await getMyVote(playerId, challenge);
      if (!isCurrent(request)) return;
      if (result.error) throw new Error(result.error.message);
      setHasVoted(Boolean(result.data));
    } catch (failure) {
      if (isCurrent(request))
        setError(
          failure instanceof Error ? failure : new Error(String(failure)),
        );
    }
  }, [playerId, challenge, isCurrent]);

  const cancelSubmission = useCallback(() => {
    ++version.current;
    submission.current?.abort();
  }, []);
  useEffect(() => {
    active.current = true;
    void reload();
    return () => {
      active.current = false;
      cancelSubmission();
    };
  }, [reload, cancelSubmission]);

  async function cast(selection: string | null) {
    if (busy.current || hasVoted !== false || !playerId) return;
    if (!selection) {
      setError(
        new Error(
          target === "team" ? "Choose a team first." : "Choose someone first.",
        ),
      );
      return;
    }
    busy.current = true;
    setSubmitting(true);
    setError(null);
    const request = version.current;
    const controller = new AbortController();
    submission.current = controller;
    try {
      const result = await castVote(
        playerId,
        challenge,
        target === "team" ? { teamId: selection } : { playerId: selection },
        controller.signal,
      );
      if (!isCurrent(request)) return;
      if (result.error) throw new Error(result.error.message);
      if (result.data?.status === "voter-missing") {
        clearPlayerId();
        setSessionInvalid(true);
      }
      if (result.data?.status === "voted") setHasVoted(true);
    } catch (failure) {
      if (isCurrent(request))
        setError(
          failure instanceof Error ? failure : new Error(String(failure)),
        );
    } finally {
      busy.current = false;
      if (isCurrent(request)) setSubmitting(false);
    }
  }
  return { hasVoted, error, sessionInvalid, submitting, reload, cast };
}
