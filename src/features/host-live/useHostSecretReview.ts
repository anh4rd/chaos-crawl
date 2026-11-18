import type { Dispatch, SetStateAction } from "react";
import * as hostSecretCommands from "../../lib/hostSecretCommands";
import * as sessionParticipantCommands from "../../lib/sessionParticipantCommands";
import { hostPlayerStorageKey } from "./hostParticipationStorage";
import type {
  GameSession,
  HostTab,
  SecretMissionAssignment,
  SecretReviewState,
  SessionChallenge,
  SessionEvidence,
} from "./types";
import type { SetHostBusy } from "./useHostOperation";

interface Options {
  session: GameSession | null;
  busy: boolean;
  evidence: SessionEvidence[];
  setBusy: SetHostBusy;
  setError: Dispatch<SetStateAction<string>>;
  setNotice: Dispatch<SetStateAction<string>>;
  load: () => Promise<void>;
  secretAssignments: SecretMissionAssignment[];
  challenges: SessionChallenge[];
  secretReviewState: SecretReviewState | null;
  setHostParticipation: (participates: boolean) => Promise<boolean>;
  setActiveTab: Dispatch<SetStateAction<HostTab>>;
}
export function useHostSecretReview({
  session,
  busy,
  evidence,
  setBusy,
  setError,
  setNotice,
  load,
  secretAssignments,
  challenges,
  secretReviewState,
  setHostParticipation,
  setActiveTab,
}: Options) {
  async function selectSecretReviewAssignment(assignmentId: string) {
    if (!session || busy) return;
    const firstEvidence = evidence.find(
      (item) => item.secret_assignment_id === assignmentId,
    );
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const { error: selectError } =
      await hostSecretCommands.hostSelectSecretReviewAssignment({
        p_session_id: session.id,
        p_assignment_id: assignmentId,
        p_evidence_id: firstEvidence?.id ?? null,
      });
    setBusy(false);
    if (selectError) {
      setError(selectError.message);
      return;
    }
    await load();
  }

  async function openSecretReviewVote(assignmentId: string) {
    if (!session || busy) return;
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const { error: openError } = await hostSecretCommands.hostOpenSecretReview({
      p_session_id: session.id,
      p_assignment_id: assignmentId,
    });
    setBusy(false);
    if (openError) {
      setError(openError.message);
      return;
    }
    setNotice("Secret mission voting is open.");
    await load();
  }

  async function reopenSecretReviewVote(assignmentId: string) {
    if (!session || busy) return;
    const assignment = secretAssignments.find(
      (item) => item.id === assignmentId,
    );
    const challenge =
      assignment &&
      challenges.find((item) => item.id === assignment.challenge_id);
    if (
      !window.confirm(
        `Reopen "${challenge?.title ?? "this secret mission"}"? This clears its votes and reverses its awarded points.`,
      )
    )
      return;
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const { error: reopenError } =
      await hostSecretCommands.hostReopenSecretReview({
        p_session_id: session.id,
        p_assignment_id: assignmentId,
      });
    setBusy(false);
    if (reopenError) {
      setError(reopenError.message);
      return;
    }
    setNotice(
      "Secret mission voting reopened with its previous votes cleared.",
    );
    await load();
  }

  async function closeSecretReviewVote() {
    if (!session || busy) return;
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const { data, error: closeError } =
      await hostSecretCommands.hostCloseSecretReviewVote({
        p_session_id: session.id,
      });
    setBusy(false);
    if (closeError) {
      setError(closeError.message);
      return;
    }
    const result = data as {
      outcome?: "success" | "fail";
      points_awarded?: number;
    } | null;
    setNotice(
      result?.outcome === "success"
        ? `Mission success confirmed · ${result.points_awarded ?? 0} points awarded.`
        : "Mission failed · no points awarded.",
    );
    await load();
  }

  async function advanceSecretReview() {
    if (!session || busy) return;
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const { data, error: advanceError } =
      await hostSecretCommands.hostAdvanceSecretReview({
        p_session_id: session.id,
      });
    setBusy(false);
    if (advanceError) {
      setError(advanceError.message);
      return;
    }
    const result = data as { completed?: boolean } | null;
    setNotice(
      result?.completed
        ? "All submitted secret missions have been reviewed."
        : "The next secret mission is open for voting, and the TV slideshow has switched to its evidence.",
    );
    await load();
  }

  async function castHostSecretReviewVote(vote: "success" | "fail") {
    if (
      !session ||
      !secretReviewState?.current_assignment_id ||
      !secretReviewState.voting_open ||
      busy
    )
      return;
    let playerToken = localStorage.getItem(hostPlayerStorageKey(session.id));
    if (!session.host_participates || !session.host_player_id || !playerToken) {
      const joined = await setHostParticipation(true);
      if (!joined) return;
      setActiveTab("side-challenges");
      playerToken = localStorage.getItem(hostPlayerStorageKey(session.id));
    }
    if (!playerToken) {
      setError(
        "Host participation was enabled, but the host player token is missing. Please rejoin as Host and try again.",
      );
      return;
    }
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const { error: voteError } =
      await sessionParticipantCommands.playerCastSecretReviewVote({
        p_join_code: session.join_code,
        p_player_token: playerToken,
        p_assignment_id: secretReviewState.current_assignment_id,
        p_vote: vote,
      });
    setBusy(false);
    if (voteError) {
      setError(voteError.message);
      return;
    }
    setNotice(`Your host vote for ${vote} has been counted.`);
    await load();
  }

  async function setSecretReviewEvidence(evidenceId: string | null) {
    if (!session || busy) return;
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const { error: slideshowError } =
      await hostSecretCommands.hostSetSecretReviewEvidence({
        p_session_id: session.id,
        p_evidence_id: evidenceId,
      });
    setBusy(false);
    if (slideshowError) {
      setError(slideshowError.message);
      return;
    }
    await load();
  }
  return {
    selectSecretReviewAssignment,
    openSecretReviewVote,
    reopenSecretReviewVote,
    closeSecretReviewVote,
    advanceSecretReview,
    castHostSecretReviewVote,
    setSecretReviewEvidence,
  };
}
