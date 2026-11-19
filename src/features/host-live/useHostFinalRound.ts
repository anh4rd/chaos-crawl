import type { Dispatch, SetStateAction } from "react";
import * as hostFinalCommands from "../../lib/hostFinalCommands";
import * as sessionParticipantCommands from "../../lib/sessionParticipantCommands";
import type {
  GameSession,
  HostTab,
  SessionChallenge,
  SessionEvidence,
} from "./types";
import type { SetHostBusy } from "./useHostOperation";

interface Options {
  session: GameSession | null;
  setBusy: SetHostBusy;
  setError: Dispatch<SetStateAction<string>>;
  setNotice: Dispatch<SetStateAction<string>>;
  load: () => Promise<void>;
  nextReviewedFinalChallenge: SessionChallenge;
  nextPendingFinalChallenge: SessionChallenge | undefined;
  selectedFinalChallenge: SessionChallenge | undefined;
  challenges: SessionChallenge[];
  busy: boolean;
  finalSideEvidence: SessionEvidence[];
  selectedFinalChallengeStatus: "voting" | "pending" | "results";
  ensureHostPlayerToken: (onRecovered?: () => void) => Promise<string | null>;
  setActiveTab: Dispatch<SetStateAction<HostTab>>;
}
export function useHostFinalRound({
  session,
  setBusy,
  setError,
  setNotice,
  load,
  nextReviewedFinalChallenge,
  nextPendingFinalChallenge,
  selectedFinalChallenge,
  challenges,
  busy,
  finalSideEvidence,
  selectedFinalChallengeStatus,
  ensureHostPlayerToken,
  setActiveTab,
}: Options) {
  async function setFinalGallery(galleryOpen: boolean, votingOpen: boolean) {
    if (!session) return;
    const closingVote = session.final_voting_open && !votingOpen;
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const { data: galleryResult, error: galleryError } =
      await hostFinalCommands.hostManageSessionFinalRound({
        p_session_id: session.id,
        p_gallery_open: galleryOpen,
        p_voting_open: votingOpen,
      });
    setBusy(false);
    if (galleryError) {
      setError(galleryError.message);
      return;
    }
    if (closingVote) {
      const votesCast = Number(
        (galleryResult as { votes_cast?: number } | null)?.votes_cast ?? 0,
      );
      setNotice(
        `Voting closed with ${votesCast} vote${votesCast === 1 ? "" : "s"}. Results and the updated leaderboard are now visible.`,
      );
    } else {
      setNotice(
        galleryOpen
          ? votingOpen
            ? "Voting is open for the selected side challenge."
            : "The current challenge results are visible."
          : "Final gallery hidden from players.",
      );
    }
    await load();
  }

  async function advanceFinalChallenge() {
    if (!session) return;
    if (nextReviewedFinalChallenge && !nextPendingFinalChallenge) {
      await reopenFinalChallengeVoting(nextReviewedFinalChallenge.id);
      return;
    }
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const { error: advanceError } =
      await hostFinalCommands.hostAdvanceSessionFinalRoundChallenge({
        p_session_id: session.id,
      });
    setBusy(false);
    if (advanceError) {
      setError(advanceError.message);
      return;
    }
    setNotice(
      "The next challenge is open for voting, and the TV slideshow has switched to its submissions.",
    );
    await load();
  }

  async function reopenFinalChallengeVoting(
    challengeId = selectedFinalChallenge?.id,
  ) {
    const challenge = challenges.find((item) => item.id === challengeId);
    if (!session || !challenge || busy) return;
    const confirmed = window.confirm(
      `Reopen voting for "${challenge.title}"? This clears its votes and reverses the bonus points awarded for this challenge.`,
    );
    if (!confirmed) return;
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const { error: reopenError } =
      await hostFinalCommands.hostReopenSessionFinalRoundChallenge({
        p_session_id: session.id,
        p_challenge_id: challenge.id,
      });
    setBusy(false);
    if (reopenError) {
      setError(reopenError.message);
      return;
    }
    setNotice("Voting reopened with previous votes cleared.");
    await load();
  }

  async function selectFinalChallenge(challengeId: string) {
    if (!session || busy) return;
    const firstItem = finalSideEvidence.find(
      (item) => item.challenge_id === challengeId,
    );
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const { error: selectError } =
      await hostFinalCommands.hostSelectSessionFinalRoundChallenge({
        p_session_id: session.id,
        p_challenge_id: challengeId,
        p_evidence_id: firstItem?.id ?? null,
      });
    setBusy(false);
    if (selectError) {
      setError(selectError.message);
      return;
    }
    await load();
  }

  async function setFinalSlideshow(
    challengeId: string,
    evidenceId: string | null,
  ) {
    if (!session || !challengeId) return;
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const { error: slideshowError } =
      await hostFinalCommands.hostSetSessionFinalSlideshow({
        p_session_id: session.id,
        p_challenge_id: challengeId,
        p_evidence_id: evidenceId,
      });
    setBusy(false);
    if (slideshowError) {
      setError(slideshowError.message);
      return;
    }
    await load();
  }

  async function castHostFinalVote(evidenceId: string) {
    if (!session || selectedFinalChallengeStatus !== "voting" || busy) return;
    const playerToken = await ensureHostPlayerToken(() =>
      setActiveTab("final-round"),
    );
    if (!playerToken) return;
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const { error: voteError } =
      await sessionParticipantCommands.playerCastSessionFinalRoundVote({
        p_join_code: session.join_code,
        p_player_token: playerToken,
        p_evidence_id: evidenceId,
      });
    setBusy(false);
    if (voteError) {
      setError(voteError.message);
      return;
    }
    setNotice("Your vote has been counted.");
    await load();
  }
  return {
    setFinalGallery,
    advanceFinalChallenge,
    reopenFinalChallengeVoting,
    selectFinalChallenge,
    setFinalSlideshow,
    castHostFinalVote,
  };
}
