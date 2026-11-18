import ReviewSummary from "../../components/session/ReviewSummary";
import VoterList from "../../components/session/VoterList";
import SessionLeaderboard from "../../components/session/SessionLeaderboard";
import StatTile from "../../components/ui/StatTile";
import Button from "../../components/ui/Button";
import FormGrid from "../../components/ui/FormGrid";
import FormLabel from "../../components/ui/FormLabel";
import ContentPanel from "../../components/ui/ContentPanel";
import PanelHeading from "../../components/ui/PanelHeading";
import Overline from "../../components/ui/Overline";
import CountBadge from "../../components/ui/CountBadge";
import Note from "../../components/ui/Note";
import type {
  GameSession,
  SecretMissionAssignment,
  SecretReviewAssignment,
  SecretReviewVote,
  SessionChallenge,
  SessionPlayer,
} from "./types";

interface Props {
  secretReviewOptions: SecretMissionAssignment[];
  votingOpen: boolean;
  selectedSecretReview: SecretReviewAssignment | undefined;
  selectedSecretReviewAssignmentId: string;
  busy: boolean;
  selectSecretReviewAssignment: (assignmentId: string) => Promise<void>;
  challenges: SessionChallenge[];
  secretReviewAssignments: SecretReviewAssignment[];
  players: SessionPlayer[];
  selectedSecretReviewChallenge: SessionChallenge | undefined;
  selectedSecretReviewAssignment: SecretMissionAssignment | undefined;
  secretReviewVotes: SecretReviewVote[];
  reopenSecretReviewVote: (assignmentId: string) => Promise<void>;
  advanceSecretReview: () => Promise<void>;
  hasPendingSecretReviews: boolean;
  currentSecretReviewVoteCount: number;
  closeSecretReviewVote: () => Promise<void>;
  session: GameSession;
  openSecretReviewVote: (assignmentId: string) => Promise<void>;
}
export default function HostSecretReview({
  secretReviewOptions,
  votingOpen,
  selectedSecretReview,
  selectedSecretReviewAssignmentId,
  busy,
  selectSecretReviewAssignment,
  challenges,
  secretReviewAssignments,
  players,
  selectedSecretReviewChallenge,
  selectedSecretReviewAssignment,
  secretReviewVotes,
  reopenSecretReviewVote,
  advanceSecretReview,
  hasPendingSecretReviews,
  currentSecretReviewVoteCount,
  closeSecretReviewVote,
  session,
  openSecretReviewVote,
}: Props) {
  return (
    <ContentPanel variant="session" stacked>
      <PanelHeading variant="session">
        <div>
          <Overline as="div" variant="session">
            SECRET MISSION VOTE
          </Overline>
          <h2>Review one mission at a time</h2>
          <p>
            A strict majority of Success awards the mission points. Fail or a
            tie is final and awards zero.
          </p>
        </div>
        <CountBadge variant="session">
          {secretReviewOptions.length} to review
        </CountBadge>
      </PanelHeading>
      {secretReviewOptions.length === 0 ? (
        <Note variant="session">
          Submitted secret missions will appear here when players mark them
          complete.
        </Note>
      ) : (
        <>
          <ContentPanel variant="review-controls" as="div">
            <Overline variant="review" as="span">
              {votingOpen
                ? "VOTING IS OPEN"
                : selectedSecretReview?.status === "results"
                  ? "RESULTS SHARED"
                  : "READY FOR REVIEW"}
            </Overline>
            <FormLabel variant="review">
              Choose a secret mission
              <select
                value={selectedSecretReviewAssignmentId}
                disabled={busy || votingOpen}
                onChange={(event) =>
                  void selectSecretReviewAssignment(event.target.value)
                }
              >
                {secretReviewOptions.map((assignment) => {
                  const mission = challenges.find(
                    (item) => item.id === assignment.challenge_id,
                  );
                  const review = secretReviewAssignments.find(
                    (item) => item.assignment_id === assignment.id,
                  );
                  const owner = players.find(
                    (item) => item.id === assignment.player_id,
                  );
                  return (
                    <option key={assignment.id} value={assignment.id}>
                      {mission?.title ?? "Secret mission"} ·{" "}
                      {owner?.name ?? "Player"}
                      {review?.status === "results" &&
                      !(
                        votingOpen &&
                        assignment.id === selectedSecretReviewAssignmentId
                      )
                        ? " · reviewed"
                        : ""}
                    </option>
                  );
                })}
              </select>
            </FormLabel>
            {selectedSecretReviewChallenge &&
              selectedSecretReviewAssignment && (
                <ReviewSummary
                  title={selectedSecretReviewChallenge.title}
                  detail={
                    <>
                      For{" "}
                      {players.find(
                        (player) =>
                          player.id ===
                          selectedSecretReviewAssignment.player_id,
                      )?.name ?? "player"}{" "}
                      · {selectedSecretReviewChallenge.points} points at stake
                    </>
                  }
                  description={selectedSecretReviewChallenge.description}
                />
              )}
            {!votingOpen && selectedSecretReview?.status === "results" ? (
              <ContentPanel as="div" variant="review-result">
                <strong>
                  {selectedSecretReview.outcome === "success"
                    ? "SUCCESS"
                    : "FAIL"}
                </strong>
                <span>
                  {selectedSecretReview.success_votes} Success ·{" "}
                  {selectedSecretReview.fail_votes} Fail ·{" "}
                  {selectedSecretReview.votes_cast} votes
                </span>
                <b>
                  {selectedSecretReview.outcome === "success"
                    ? `+${selectedSecretReview.points_awarded} points awarded`
                    : "No points awarded · final result"}
                </b>
                <VoterList
                  voters={secretReviewVotes
                    .filter(
                      (vote) =>
                        vote.assignment_id === selectedSecretReviewAssignmentId,
                    )
                    .map((vote) => ({
                      id: vote.player_id,
                      name:
                        players.find((player) => player.id === vote.player_id)
                          ?.name ?? "Player",
                      choice: vote.vote,
                    }))}
                />
                <strong>Leaderboard changes</strong>
                <SessionLeaderboard
                  variant="compact"
                  entries={[...players]
                    .sort(
                      (a, b) =>
                        b.score - a.score || a.name.localeCompare(b.name),
                    )
                    .slice(0, 8)
                    .map((player) => ({
                      id: player.id,
                      name: player.name,
                      score: player.score,
                    }))}
                />
                <FormGrid variant="review">
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void reopenSecretReviewVote(
                        selectedSecretReviewAssignmentId,
                      )
                    }
                    variant="review"
                    fullWidth={false}
                  >
                    Reopen voting
                  </Button>
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() => void advanceSecretReview()}
                    variant="review-primary"
                    className="btn--review-wide"
                    fullWidth={false}
                  >
                    {hasPendingSecretReviews
                      ? "Next challenge"
                      : "Return all players to the game"}
                  </Button>
                </FormGrid>
              </ContentPanel>
            ) : votingOpen ? (
              <>
                <StatTile
                  variant="review"
                  label="Votes cast"
                  value={
                    <>
                      {currentSecretReviewVoteCount} / {players.length}
                    </>
                  }
                />
                <FormGrid variant="review">
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() => void closeSecretReviewVote()}
                    variant="review-primary"
                    className="btn--review-wide"
                    fullWidth={false}
                  >
                    Close voting and show results
                  </Button>
                </FormGrid>
                {!session?.host_participates && (
                  <Note variant="session" as="small">
                    To vote as host, enable host participation in Host Controls.
                  </Note>
                )}
              </>
            ) : (
              <FormGrid variant="review">
                <Button
                  type="button"
                  disabled={busy || !selectedSecretReviewAssignmentId}
                  onClick={() =>
                    void openSecretReviewVote(selectedSecretReviewAssignmentId)
                  }
                  variant="review-primary"
                  className="btn--review-wide"
                  fullWidth={false}
                >
                  Open voting for this mission
                </Button>
              </FormGrid>
            )}
          </ContentPanel>
        </>
      )}
    </ContentPanel>
  );
}
