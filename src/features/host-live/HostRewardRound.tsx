import SessionCandidate from "../../components/session/SessionCandidate";
import { rewardPresentation } from "./rewardPresentation";
import type { Dispatch, SetStateAction } from "react";
import { type FormEvent } from "react";
import SessionRewardRound from "../../components/session/SessionRewardRound";
import Icon from "../../components/ui/Icon";
import type {
  SessionRewardRound as HostRewardRoundData,
  GameSession,
  RewardMethod,
  RewardTargetKind,
  SessionChallenge,
  SessionPlayer,
  SessionRewardAward,
  SessionRewardVote,
  SessionTeam,
} from "./types";

interface HostRewardRoundProps {
  canParticipate?: boolean;
  showRewardOverlay: boolean;
  enabledRewardMethods: RewardMethod[];
  setShowRewardOverlay: Dispatch<SetStateAction<boolean>>;
  activeRewardRound: HostRewardRoundData | null;
  session: GameSession;
  showRewardSetup: boolean;
  busy: boolean;
  setShowRewardSetup: Dispatch<SetStateAction<boolean>>;
  startRewardRound: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  rewardChallengeId: string;
  setRewardChallengeId: Dispatch<SetStateAction<string>>;
  challenges: SessionChallenge[];
  setRewardPoints: Dispatch<SetStateAction<number>>;
  rewardMethod: RewardMethod;
  setRewardMethod: Dispatch<SetStateAction<RewardMethod>>;
  rewardMethodLabel: (
    method: RewardMethod,
  ) => "Player voting" | "Host awards" | "Audience cheers";
  rewardTargetKind: RewardTargetKind;
  setRewardTargetKind: Dispatch<SetStateAction<RewardTargetKind>>;
  setSelectedRewardWinnerIds: Dispatch<SetStateAction<string[]>>;
  teams: SessionTeam[];
  rewardPoints: number;
  activeRewardChallenge: SessionChallenge | undefined;
  activeRewardVotes: SessionRewardVote[];
  rewardTargetRows: {
    id: string;
    name: string;
    detail: string;
    score: number;
  }[];
  hostRewardVoteTargetId: string | null | undefined;
  castHostRewardVote: (candidateId: string) => Promise<void>;
  cancelRewardRound: () => Promise<void>;
  completeRewardRound: () => Promise<void>;
  rewardFinalPoints: number;
  setRewardFinalPoints: Dispatch<SetStateAction<number>>;
  selectedRewardWinnerIds: string[];
  toggleRewardWinner: (id: string) => void;
  activeRewardAwards: SessionRewardAward[];
  playerById: Map<string, SessionPlayer>;
  teamById: Map<string, SessionTeam>;
  players: SessionPlayer[];
  returnFromRewardRound: () => Promise<void>;
}

export default function HostRewardRound({
  canParticipate = false,
  showRewardOverlay,
  enabledRewardMethods,
  setShowRewardOverlay,
  activeRewardRound,
  session,
  showRewardSetup,
  busy,
  setShowRewardSetup,
  startRewardRound,
  rewardChallengeId,
  setRewardChallengeId,
  challenges,
  setRewardPoints,
  rewardMethod,
  setRewardMethod,
  rewardMethodLabel,
  rewardTargetKind,
  setRewardTargetKind,
  setSelectedRewardWinnerIds,
  teams,
  rewardPoints,
  activeRewardChallenge,
  activeRewardVotes,
  rewardTargetRows,
  hostRewardVoteTargetId,
  castHostRewardVote,
  cancelRewardRound,
  completeRewardRound,
  rewardFinalPoints,
  setRewardFinalPoints,
  selectedRewardWinnerIds,
  toggleRewardWinner,
  activeRewardAwards,
  players,
  returnFromRewardRound,
}: HostRewardRoundProps) {
  return (
    <section
      className={`cc-session-card cc-session-section cc-reward-points-section${showRewardOverlay ? " cc-reward-points-overlay" : ""}`}
      data-tour="host-reward"
      role={showRewardOverlay ? "dialog" : undefined}
      aria-modal={showRewardOverlay || undefined}
      aria-label={showRewardOverlay ? "Review points and voting" : undefined}
    >
      <div className="cc-session-section-heading">
        <div>
          <div className="cc-section-kicker">REWARD POINTS</div>
          <h2>Review points</h2>
          <p>
            Choose a challenge, then run the player vote or award flow without
            leaving the game screen.
          </p>
        </div>
        <span className="cc-count-pill">
          {enabledRewardMethods.length} methods enabled
        </span>
        {showRewardOverlay && (
          <button
            type="button"
            className="cc-reward-overlay-close"
            onClick={() => setShowRewardOverlay(false)}
            aria-label="Return to game"
          >
            ×
          </button>
        )}
      </div>

      {!activeRewardRound && session.status === "live" && !showRewardSetup && (
        <button
          type="button"
          className="host-button host-button--lime"
          disabled={busy || enabledRewardMethods.length === 0}
          onClick={() => setShowRewardSetup(true)}
        >
          <Icon name="sparkles" className="icon--size-16" /> Reward Points
        </button>
      )}

      {!activeRewardRound && showRewardSetup && session.status === "live" && (
        <form
          className="cc-reward-setup-form"
          onSubmit={(event) => void startRewardRound(event)}
        >
          <label>
            <span>Challenge</span>
            <select
              required
              value={rewardChallengeId}
              onChange={(event) => {
                const nextId = event.target.value;
                setRewardChallengeId(nextId);
                const chosen = challenges.find((item) => item.id === nextId);
                if (chosen) setRewardPoints(chosen.points);
              }}
              disabled={busy}
            >
              <option value="">Choose challenge…</option>
              {challenges.map((challenge) => (
                <option key={challenge.id} value={challenge.id}>
                  {challenge.kind === "main"
                    ? `Round ${challenge.round_number}`
                    : challenge.kind === "side"
                      ? "Side challenge"
                      : "Secret mission"}{" "}
                  · {challenge.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Reward method</span>
            <select
              value={rewardMethod}
              onChange={(event) =>
                setRewardMethod(event.target.value as RewardMethod)
              }
              disabled={busy}
            >
              {enabledRewardMethods.map((method) => (
                <option key={method} value={method}>
                  {rewardMethodLabel(method)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Reward players or teams?</span>
            <select
              value={rewardTargetKind}
              onChange={(event) => {
                setRewardTargetKind(event.target.value as RewardTargetKind);
                setSelectedRewardWinnerIds([]);
              }}
              disabled={busy}
            >
              <option value="player">Individual players</option>
              <option
                value="team"
                disabled={!session.teams_enabled || teams.length === 0}
              >
                Teams
              </option>
            </select>
          </label>
          <label>
            <span>Points per winner</span>
            <input
              type="number"
              min={0}
              max={10000}
              value={rewardPoints}
              onChange={(event) => setRewardPoints(Number(event.target.value))}
              disabled={busy}
            />
          </label>
          <p className="cc-helper-text">
            The player screens will switch to the selected reward flow until you
            release them back to the game. If the vote is tied, every top-voted
            player/team wins.
          </p>
          <div className="cc-reward-actions">
            <button
              type="button"
              className="host-button host-button--ghost"
              disabled={busy}
              onClick={() => setShowRewardSetup(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="host-button host-button--lime"
              disabled={
                busy || !rewardChallengeId || enabledRewardMethods.length === 0
              }
            >
              {busy ? (
                <Icon name="loader-circle" className="icon--size-16 cc-spin" />
              ) : (
                <Icon name="play" className="icon--size-16" />
              )}{" "}
              Start reward flow
            </button>
          </div>
        </form>
      )}

      {activeRewardRound && (
        <div className="cc-reward-live-panel">
          <SessionRewardRound
            busy={busy}
            viewerId={session.host_player_id}
            onVote={
              canParticipate ? (id) => void castHostRewardVote(id) : undefined
            }
            round={rewardPresentation(
              activeRewardRound,
              activeRewardChallenge?.title ?? "Reward round",
              activeRewardVotes,
              activeRewardAwards,
              rewardTargetRows,
              players,
              teams,
              hostRewardVoteTargetId,
            )}
          />
          {!(
            activeRewardRound.status === "open" &&
            activeRewardRound.reward_method === "voting"
          ) && (
            <div className="cc-reward-mode-heading">
              <span
                className={`cc-reward-mode-icon cc-reward-mode-icon--${activeRewardRound.reward_method}`}
              >
                {activeRewardRound.reward_method === "voting"
                  ? "VOTE"
                  : activeRewardRound.reward_method === "host_awards"
                    ? "HOST"
                    : "CHEER"}
              </span>
              <div>
                <h3>{activeRewardChallenge?.title ?? "Reward round"}</h3>
                <p>
                  {rewardMethodLabel(activeRewardRound.reward_method)} ·{" "}
                  {activeRewardRound.points} points per winner ·{" "}
                  {activeRewardRound.target_kind === "team"
                    ? "Teams"
                    : "Players"}
                </p>
              </div>
              <span
                className={`cc-reward-status cc-reward-status--${activeRewardRound.status}`}
              >
                {activeRewardRound.status === "open"
                  ? "In progress"
                  : "Results shown"}
              </span>
            </div>
          )}

          {activeRewardRound.status === "open" &&
            activeRewardRound.reward_method === "voting" && (
              <div className="cc-reward-actions">
                <button
                  type="button"
                  className="host-button"
                  disabled={busy}
                  onClick={() => void cancelRewardRound()}
                >
                  Cancel flow
                </button>
                <button
                  type="button"
                  className="host-button host-button--lime"
                  disabled={busy}
                  onClick={() => void completeRewardRound()}
                >
                  Close voting &amp; award winner(s)
                </button>
              </div>
            )}

          {activeRewardRound.status === "open" &&
            activeRewardRound.reward_method !== "voting" && (
              <>
                <div className="cc-reward-instructions">
                  <strong>
                    {activeRewardRound.reward_method === "audience_cheers"
                      ? "Call out the contenders"
                      : "Select the winners"}
                  </strong>
                  <span>
                    {activeRewardRound.reward_method === "audience_cheers"
                      ? "Players' screens explain the rules. Call each name in turn, listen for the loudest cheers, then select the winner or winners below."
                      : "Players are waiting on their devices. Select one or more winners below, then confirm the award."}
                  </span>
                </div>
                <label className="cc-reward-final-points">
                  <span>Points to award each winner</span>
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    value={rewardFinalPoints}
                    onChange={(event) =>
                      setRewardFinalPoints(Number(event.target.value))
                    }
                    disabled={busy}
                  />
                </label>
                <div className="cc-reward-candidate-list">
                  {rewardTargetRows.map((candidate) => (
                    <SessionCandidate
                      key={candidate.id}
                      name={candidate.name}
                      detail={`${candidate.detail} · ${candidate.score} pts`}
                      selected={selectedRewardWinnerIds.includes(candidate.id)}
                      busy={busy}
                      actionLabel="Select winner"
                      onSelect={() => toggleRewardWinner(candidate.id)}
                    />
                  ))}
                </div>
                <div className="cc-reward-actions">
                  <button
                    type="button"
                    className="host-button host-button--ghost"
                    disabled={busy}
                    onClick={() => void cancelRewardRound()}
                  >
                    Cancel flow
                  </button>
                  <button
                    type="button"
                    className="host-button host-button--lime"
                    disabled={busy || selectedRewardWinnerIds.length === 0}
                    onClick={() => void completeRewardRound()}
                  >
                    <Icon name="check" className="icon--size-16" /> Confirm
                    winners & award points
                  </button>
                </div>
              </>
            )}

          {activeRewardRound.status === "completed" && (
            <button
              type="button"
              className="host-button host-button--lime"
              disabled={busy}
              onClick={() => void returnFromRewardRound()}
            >
              Return everyone to game
            </button>
          )}
        </div>
      )}

      {session.status !== "live" && !activeRewardRound && (
        <p className="cc-helper-text">
          Start the game before opening a reward flow. Reward methods enabled in
          setup:{" "}
          {enabledRewardMethods.map(rewardMethodLabel).join(", ") || "none"}.
        </p>
      )}
    </section>
  );
}
