import SessionFinalRound from "../../components/session/SessionFinalRound";
import Icon from "../../components/ui/Icon";
import HostManagement from "./HostManagement";
import type {
  GameSession,
  SessionChallenge,
  SessionEvidence,
  SessionFinalRoundChallenge,
  SessionFinalVote,
  SessionPlayer,
} from "./types";

interface HostFinalRoundProps {
  participantView?: boolean;
  canVote?: boolean;
  selectedFinalChallengeEvidence: SessionEvidence[];
  sideChallenges: SessionChallenge[];
  selectedFinalChallengeId: string;
  busy: boolean;
  selectedFinalChallengeStatus: "pending" | "voting" | "results";
  selectFinalChallenge: (challengeId: string) => Promise<void>;
  setFinalGallery: (galleryOpen: boolean, votingOpen: boolean) => Promise<void>;
  selectedFinalChallengeVotes: SessionFinalVote[];
  players: SessionPlayer[];
  session: GameSession;
  selectedFinalChallengeState: SessionFinalRoundChallenge | undefined;
  reopenFinalChallengeVoting: (
    challengeId?: string | undefined,
  ) => Promise<void>;
  nextPendingFinalChallenge: SessionChallenge | undefined;
  advanceFinalChallenge: () => Promise<void>;
  isFinalSlideshowConnected: boolean;
  selectedFinalEvidenceIndex: number;
  setFinalSlideshow: (
    challengeId: string,
    evidenceId: string | null,
  ) => Promise<void>;
  selectedFinalEvidence: SessionEvidence;
  disconnectFinalSlideshow: () => void;
  castFinalSlideshow: () => Promise<void>;
  selectedFinalChallenge: SessionChallenge | undefined;
  playerById: Map<string, SessionPlayer>;
  evidenceUrl: (path: string) => string;
  castHostFinalVote: (evidenceId: string) => Promise<void>;
  finalTopVoteCount: number;
  finalWinningEvidenceIds: Set<string>;
  rankedPlayers: SessionPlayer[];
}

export default function HostFinalRound({
  participantView = false,
  canVote = false,
  selectedFinalChallengeEvidence,
  sideChallenges,
  selectedFinalChallengeId,
  busy,
  selectedFinalChallengeStatus,
  selectFinalChallenge,
  setFinalGallery,
  selectedFinalChallengeVotes,
  players,
  session,
  selectedFinalChallengeState,
  reopenFinalChallengeVoting,
  nextPendingFinalChallenge,
  advanceFinalChallenge,
  isFinalSlideshowConnected,
  selectedFinalEvidenceIndex,
  setFinalSlideshow,
  selectedFinalEvidence,
  disconnectFinalSlideshow,
  castFinalSlideshow,
  selectedFinalChallenge,
  playerById,
  evidenceUrl,
  castHostFinalVote,
  finalWinningEvidenceIds,
  rankedPlayers,
}: HostFinalRoundProps) {
  return (
    <>
      <HostManagement>
        <section className="cc-session-card" data-tour="host-final-round">
          <div className="cc-host-final-controls">
            <strong className="cc-host-final-controls-title">
              HOST CONTROLS
            </strong>
            <div className="cc-host-final-control-grid">
              {sideChallenges.length > 0 && (
                <label className="cc-host-final-challenge-picker">
                  Choose side challenge
                  <select
                    value={selectedFinalChallengeId}
                    disabled={busy || selectedFinalChallengeStatus === "voting"}
                    title={
                      selectedFinalChallengeStatus === "voting"
                        ? "Close the current vote before changing challenges."
                        : undefined
                    }
                    onChange={(event) =>
                      void selectFinalChallenge(event.target.value)
                    }
                  >
                    {sideChallenges.map((challenge) => (
                      <option value={challenge.id} key={challenge.id}>
                        {challenge.title}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {selectedFinalChallengeStatus === "pending" &&
                sideChallenges.length > 0 && (
                  <>
                    <button
                      type="button"
                      className="host-button cc-host-final-control-button is-primary"
                      disabled={busy}
                      onClick={() => void setFinalGallery(true, true)}
                    >
                      <Icon name="heart" className="icon--size-15" /> Open
                      Voting
                    </button>
                  </>
                )}
              {selectedFinalChallengeStatus === "voting" && (
                <>
                  <div className="cc-host-final-player-count">
                    <span>Players voted</span>
                    <strong>
                      {selectedFinalChallengeVotes.length}/{players.length}
                    </strong>
                  </div>
                  <button
                    type="button"
                    className="host-button cc-host-final-control-button is-primary"
                    disabled={busy}
                    onClick={() => void setFinalGallery(true, false)}
                  >
                    <Icon name="flag" className="icon--size-15" /> Show Results
                  </button>
                </>
              )}
              {selectedFinalChallengeStatus === "results" && (
                <>
                  {session.final_gallery_open ? (
                    <>
                      <div className="cc-host-final-player-count">
                        <span>Results shared</span>
                        <strong>
                          {selectedFinalChallengeState?.votes_cast ?? 0} votes
                        </strong>
                      </div>
                      <button
                        type="button"
                        className="host-button cc-host-final-control-button"
                        disabled={busy}
                        onClick={() => void reopenFinalChallengeVoting()}
                      >
                        <Icon name="heart" className="icon--size-15" /> Reopen
                        Voting
                      </button>
                      {nextPendingFinalChallenge ? (
                        <button
                          type="button"
                          className="host-button cc-host-final-control-button is-primary is-wide"
                          disabled={busy}
                          onClick={() => void advanceFinalChallenge()}
                        >
                          <Icon name="arrow-right" className="icon--size-15" />{" "}
                          Next challenge · {nextPendingFinalChallenge.title}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="host-button cc-host-final-control-button is-primary is-wide"
                          disabled={busy}
                          onClick={() => void setFinalGallery(false, false)}
                        >
                          Return all players to game
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="host-button cc-host-final-control-button"
                        disabled={busy}
                        onClick={() => void setFinalGallery(true, false)}
                      >
                        <Icon name="heart" className="icon--size-15" /> Show
                        Results
                      </button>
                      <button
                        type="button"
                        className="host-button cc-host-final-control-button"
                        disabled={busy}
                        onClick={() => void reopenFinalChallengeVoting()}
                      >
                        <Icon name="heart" className="icon--size-15" /> Reopen
                        Voting
                      </button>
                      {nextPendingFinalChallenge ? (
                        <button
                          type="button"
                          className="host-button cc-host-final-control-button is-primary is-wide"
                          disabled={busy || !session.final_gallery_open}
                          title="Share the results before moving to the next challenge."
                          onClick={() => void advanceFinalChallenge()}
                        >
                          <Icon name="arrow-right" className="icon--size-15" />{" "}
                          Next challenge · {nextPendingFinalChallenge.title}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="host-button cc-host-final-control-button is-primary is-wide"
                          disabled={busy}
                          onClick={() => void setFinalGallery(false, false)}
                        >
                          Return all players to game
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
              {(selectedFinalChallengeStatus === "voting" ||
                selectedFinalChallengeStatus === "results") && (
                <>
                  {isFinalSlideshowConnected && (
                    <>
                      <button
                        type="button"
                        className="host-button cc-host-final-control-button"
                        disabled={
                          busy || selectedFinalChallengeEvidence.length < 2
                        }
                        onClick={() => {
                          const index =
                            (selectedFinalEvidenceIndex -
                              1 +
                              selectedFinalChallengeEvidence.length) %
                            selectedFinalChallengeEvidence.length;
                          const item = selectedFinalChallengeEvidence[index];
                          if (item)
                            void setFinalSlideshow(
                              selectedFinalChallengeId,
                              item.id,
                            );
                        }}
                      >
                        <Icon name="arrow-left" className="icon--size-15" />{" "}
                        Previous
                      </button>
                      <button
                        type="button"
                        className="host-button cc-host-final-control-button"
                        disabled={
                          busy || selectedFinalChallengeEvidence.length < 2
                        }
                        onClick={() => {
                          const index =
                            (selectedFinalEvidenceIndex + 1) %
                            selectedFinalChallengeEvidence.length;
                          const item = selectedFinalChallengeEvidence[index];
                          if (item)
                            void setFinalSlideshow(
                              selectedFinalChallengeId,
                              item.id,
                            );
                        }}
                      >
                        Next{" "}
                        <Icon name="arrow-right" className="icon--size-15" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className={`host-button cc-host-final-control-button${isFinalSlideshowConnected ? " is-primary" : ""}`}
                    disabled={
                      !isFinalSlideshowConnected &&
                      (!selectedFinalEvidence || busy)
                    }
                    onClick={() =>
                      isFinalSlideshowConnected
                        ? disconnectFinalSlideshow()
                        : void castFinalSlideshow()
                    }
                  >
                    <Icon name="cast" className="icon--size-15" />
                    {isFinalSlideshowConnected ? "Disconnect" : "Cast"}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </HostManagement>
      {!participantView && (
        <SessionFinalRound
          title={selectedFinalChallenge?.title}
          description={selectedFinalChallenge?.description}
          points={selectedFinalChallenge?.points ?? 0}
          galleryOpen={
            session.final_gallery_open ||
            selectedFinalChallengeStatus === "results"
          }
          votingOpen={selectedFinalChallengeStatus === "voting"}
          completed={selectedFinalChallengeStatus === "results"}
          busy={busy}
          entries={selectedFinalChallengeEvidence.map((item) => {
            const submitter = playerById.get(item.player_id);
            const votes = selectedFinalChallengeVotes.filter(
              (vote) => vote.evidence_id === item.id,
            );
            return {
              id: item.id,
              participant: {
                name: submitter?.name ?? "Player",
                avatarUrl: submitter?.avatar_url,
              },
              challengeTitle: selectedFinalChallenge?.title ?? "Side challenge",
              media: {
                id: item.id,
                url: evidenceUrl(item.storage_path),
                mediaType: item.media_type,
                description: `${submitter?.name ?? "Player"}'s side challenge submission`,
              },
              selected: selectedFinalChallengeVotes.some(
                (vote) =>
                  vote.player_id === session.host_player_id &&
                  vote.evidence_id === item.id,
              ),
              winner:
                selectedFinalChallengeStatus === "results" &&
                finalWinningEvidenceIds.has(item.id),
              voteCount:
                selectedFinalChallengeStatus === "results"
                  ? votes.length
                  : null,
              voters:
                selectedFinalChallengeStatus === "results"
                  ? votes.map((vote) => ({
                      id: vote.player_id,
                      name: playerById.get(vote.player_id)?.name ?? "Player",
                      avatarUrl: playerById.get(vote.player_id)?.avatar_url,
                    }))
                  : undefined,
            };
          })}
          onVote={canVote ? (id) => void castHostFinalVote(id) : undefined}
          leaderboard={rankedPlayers.map((player) => ({
            id: player.id,
            name: player.name,
            score: player.score,
            avatarUrl: player.avatar_url,
          }))}
        />
      )}
    </>
  );
}
