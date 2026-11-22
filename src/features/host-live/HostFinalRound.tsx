import StatTile from "../../components/ui/StatTile";
import FormLabel from "../../components/ui/FormLabel";
import FormGrid from "../../components/ui/FormGrid";
import Overline from "../../components/ui/Overline";
import ContentPanel from "../../components/ui/ContentPanel";
import Button from "../../components/ui/Button";
import SessionFinalRound from "../../components/session/SessionFinalRound";
import Icon from "../../components/ui/Icon";
import PanelHeading from "../../components/ui/PanelHeading";
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
      <ContentPanel variant="session" data-tour="host-final-round">
        <PanelHeading variant="session">
          <h2>Final round</h2>
        </PanelHeading>
        <ContentPanel variant="review-controls" as="div">
          <Overline variant="review" as="strong">
            HOST CONTROLS
          </Overline>
          <FormGrid variant="review">
            {sideChallenges.length > 0 && (
              <FormLabel variant="review">
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
              </FormLabel>
            )}
            {selectedFinalChallengeStatus === "pending" &&
              sideChallenges.length > 0 && (
                <>
                  <Button
                    type="button"
                    fullWidth={false}
                    disabled={busy}
                    onClick={() => void setFinalGallery(true, true)}
                    variant="review-comic-primary"
                  >
                    <Icon name="heart" className="icon--size-15" /> Open Voting
                  </Button>
                </>
              )}
            {selectedFinalChallengeStatus === "voting" && (
              <>
                <StatTile
                  variant="review"
                  label="Players voted"
                  value={
                    <>
                      {selectedFinalChallengeVotes.length}/{players.length}
                    </>
                  }
                />
                <Button
                  type="button"
                  fullWidth={false}
                  disabled={busy}
                  onClick={() => void setFinalGallery(true, false)}
                  variant="review-comic-primary"
                >
                  <Icon name="flag" className="icon--size-15" /> Show Results
                </Button>
              </>
            )}
            {selectedFinalChallengeStatus === "results" && (
              <>
                {session.final_gallery_open ? (
                  <>
                    <StatTile
                      variant="review"
                      label="Results shared"
                      value={
                        <>
                          {selectedFinalChallengeState?.votes_cast ?? 0} votes
                        </>
                      }
                    />
                    <Button
                      type="button"
                      fullWidth={false}
                      disabled={busy}
                      onClick={() => void reopenFinalChallengeVoting()}
                      variant="review-comic"
                    >
                      <Icon name="heart" className="icon--size-15" /> Reopen
                      Voting
                    </Button>
                    {nextPendingFinalChallenge ? (
                      <Button
                        type="button"
                        fullWidth={false}
                        disabled={busy}
                        onClick={() => void advanceFinalChallenge()}
                        variant="review-comic-primary"
                        className="btn--review-wide"
                      >
                        <Icon name="arrow-right" className="icon--size-15" />{" "}
                        Next challenge · {nextPendingFinalChallenge.title}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        fullWidth={false}
                        disabled={busy}
                        onClick={() => void setFinalGallery(false, false)}
                        variant="review-comic-primary"
                        className="btn--review-wide"
                      >
                        Return all players to game
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      fullWidth={false}
                      disabled={busy}
                      onClick={() => void setFinalGallery(true, false)}
                      variant="review-comic"
                    >
                      <Icon name="heart" className="icon--size-15" /> Show
                      Results
                    </Button>
                    <Button
                      type="button"
                      fullWidth={false}
                      disabled={busy}
                      onClick={() => void reopenFinalChallengeVoting()}
                      variant="review-comic"
                    >
                      <Icon name="heart" className="icon--size-15" /> Reopen
                      Voting
                    </Button>
                    {nextPendingFinalChallenge ? (
                      <Button
                        type="button"
                        fullWidth={false}
                        disabled={busy || !session.final_gallery_open}
                        title="Share the results before moving to the next challenge."
                        onClick={() => void advanceFinalChallenge()}
                        variant="review-comic-primary"
                        className="btn--review-wide"
                      >
                        <Icon name="arrow-right" className="icon--size-15" />{" "}
                        Next challenge · {nextPendingFinalChallenge.title}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        fullWidth={false}
                        disabled={busy}
                        onClick={() => void setFinalGallery(false, false)}
                        variant="review-comic-primary"
                        className="btn--review-wide"
                      >
                        Return all players to game
                      </Button>
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
                    <Button
                      type="button"
                      fullWidth={false}
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
                      variant="review-comic"
                    >
                      <Icon name="arrow-left" className="icon--size-15" />{" "}
                      Previous
                    </Button>
                    <Button
                      type="button"
                      fullWidth={false}
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
                      variant="review-comic"
                    >
                      Next <Icon name="arrow-right" className="icon--size-15" />
                    </Button>
                  </>
                )}
                <Button
                  type="button"
                  fullWidth={false}
                  disabled={
                    !isFinalSlideshowConnected &&
                    (!selectedFinalEvidence || busy)
                  }
                  onClick={() =>
                    isFinalSlideshowConnected
                      ? disconnectFinalSlideshow()
                      : void castFinalSlideshow()
                  }
                  variant={
                    isFinalSlideshowConnected
                      ? "review-comic-primary"
                      : "review-comic"
                  }
                >
                  <Icon name="cast" className="icon--size-15" />
                  {isFinalSlideshowConnected ? "Disconnect" : "Cast"}
                </Button>
              </>
            )}
          </FormGrid>
        </ContentPanel>
      </ContentPanel>
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
