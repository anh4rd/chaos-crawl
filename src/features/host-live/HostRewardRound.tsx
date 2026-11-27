import type { RewardMethod, RewardTargetKind } from "../../types/hostSession";
import Dialog from "../../components/ui/Dialog";
import RoundSummary from "../../components/ui/RoundSummary";
import IconBadge from "../../components/ui/IconBadge";
import StatusPill from "../../components/ui/StatusPill";
import ControlRow from "../../components/ui/ControlRow";
import ContentPanel from "../../components/ui/ContentPanel";
import PanelHeading from "../../components/ui/PanelHeading";
import Overline from "../../components/ui/Overline";
import CountBadge from "../../components/ui/CountBadge";
import Note from "../../components/ui/Note";
import Button from "../../components/ui/Button";
import RewardSetupForm from "./RewardSetupForm";
import RewardAwardControls from "./RewardAwardControls";
import { rewardPresentation } from "./rewardPresentation";
import type { Dispatch, SetStateAction, ReactNode } from "react";
import { type FormEvent } from "react";
import SessionRewardRound from "../../components/session/SessionRewardRound";
import Icon from "../../components/ui/Icon";
import type {
  SessionRewardRound as HostRewardRoundData,
  GameSession,
  SessionChallenge,
  SessionPlayer,
  SessionRewardAward,
  SessionRewardVote,
  SessionTeam,
} from "./types";

interface HostRewardRoundProps {
  feedback?: ReactNode;
  canParticipate?: boolean;
  currentChallenge: SessionChallenge | undefined;
  decideRewardInGame: boolean | null;
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
  teamPhotoUrls: Record<string, string>;
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
  players: SessionPlayer[];
  returnFromRewardRound: () => Promise<void>;
}

export default function HostRewardRound({
  feedback,
  canParticipate = false,
  currentChallenge,
  decideRewardInGame,
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
  teamPhotoUrls,
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
  const candidates = rewardTargetRows.map((candidate) => ({
    ...candidate,
    avatarUrl:
      activeRewardRound?.target_kind === "team"
        ? teamPhotoUrls[candidate.id]
        : players.find((player) => player.id === candidate.id)?.avatar_url,
  }));
  const content = (
    <ContentPanel
      variant="session"
      stacked
      className="reward-review"
      overlay={showRewardOverlay}
      data-tour="host-reward"
    >
      <PanelHeading variant="session" dismissible={showRewardOverlay}>
        <div>
          <Overline as="div" variant="session">
            REWARD POINTS
          </Overline>
          <h2>Review points</h2>
          <p>
            {showRewardOverlay
              ? "Choose how to award points for this round."
              : "Choose a challenge, then run the player vote or award flow without leaving the game screen."}
          </p>
        </div>
        {!showRewardOverlay && (
          <CountBadge variant="session">
            {enabledRewardMethods.length} methods enabled
          </CountBadge>
        )}
        {showRewardOverlay && (
          <Button
            type="button"
            variant="overlay-dismiss"
            fullWidth={false}
            onClick={() => setShowRewardOverlay(false)}
            aria-label="Return to game"
            disabled={busy}
          >
            ×
          </Button>
        )}
      </PanelHeading>
      {feedback}

      {!activeRewardRound && session.status === "live" && !showRewardSetup && (
        <Button
          type="button"
          variant="session-action"
          fullWidth={false}
          disabled={busy || enabledRewardMethods.length === 0}
          onClick={() => setShowRewardSetup(true)}
        >
          <Icon name="sparkles" className="icon--size-16" /> Reward Points
        </Button>
      )}

      {!activeRewardRound && showRewardSetup && session.status === "live" && (
        <RewardSetupForm
          key={showRewardOverlay ? "round-review" : "reward-setup"}
          busy={busy}
          currentRoundOnly={showRewardOverlay}
          currentChallenge={currentChallenge}
          decideRewardInGame={decideRewardInGame}
          rewardChallengeId={rewardChallengeId}
          setRewardChallengeId={setRewardChallengeId}
          challenges={challenges}
          setRewardPoints={setRewardPoints}
          rewardMethod={rewardMethod}
          setRewardMethod={setRewardMethod}
          enabledRewardMethods={enabledRewardMethods}
          rewardMethodLabel={rewardMethodLabel}
          rewardTargetKind={rewardTargetKind}
          setRewardTargetKind={setRewardTargetKind}
          setSelectedRewardWinnerIds={setSelectedRewardWinnerIds}
          session={session}
          teams={teams}
          rewardPoints={rewardPoints}
          startRewardRound={startRewardRound}
          setShowRewardSetup={setShowRewardSetup}
        />
      )}

      {activeRewardRound && (
        <div className="reward-review__content">
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
              candidates,
              players,
              teams,
              hostRewardVoteTargetId,
            )}
          />
          {!(
            activeRewardRound.status === "open" &&
            activeRewardRound.reward_method === "voting"
          ) && (
            <RoundSummary
              title={activeRewardChallenge?.title ?? "Reward round"}
              detail={
                <>
                  {rewardMethodLabel(activeRewardRound.reward_method)} ·{" "}
                  {activeRewardRound.points} points per winner ·{" "}
                  {activeRewardRound.target_kind === "team"
                    ? "Teams"
                    : "Players"}
                </>
              }
              marker={
                <IconBadge
                  variant="method"
                  tone={
                    activeRewardRound.reward_method === "host_awards"
                      ? "lime"
                      : activeRewardRound.reward_method === "audience_cheers"
                        ? "pink"
                        : "violet"
                  }
                >
                  {activeRewardRound.reward_method === "voting"
                    ? "VOTE"
                    : activeRewardRound.reward_method === "host_awards"
                      ? "HOST"
                      : "CHEER"}
                </IconBadge>
              }
              status={
                <StatusPill
                  variant="reward"
                  tone={
                    activeRewardRound.status === "open" ? "open" : "completed"
                  }
                >
                  {activeRewardRound.status === "open"
                    ? "In progress"
                    : "Results shown"}
                </StatusPill>
              }
            />
          )}

          {activeRewardRound.status === "open" &&
            activeRewardRound.reward_method === "voting" && (
              <ControlRow variant="reward">
                <Button
                  type="button"
                  variant="comic"
                  fullWidth={false}
                  disabled={busy}
                  onClick={() => void cancelRewardRound()}
                >
                  Cancel flow
                </Button>
                <Button
                  type="button"
                  variant="session-action"
                  fullWidth={false}
                  disabled={busy}
                  onClick={() => void completeRewardRound()}
                >
                  Close voting &amp; award winner(s)
                </Button>
              </ControlRow>
            )}

          {activeRewardRound.status === "open" &&
            activeRewardRound.reward_method !== "voting" && (
              <RewardAwardControls
                method={activeRewardRound.reward_method}
                rewardFinalPoints={rewardFinalPoints}
                setRewardFinalPoints={setRewardFinalPoints}
                busy={busy}
                rewardTargetRows={candidates}
                selectedRewardWinnerIds={selectedRewardWinnerIds}
                toggleRewardWinner={toggleRewardWinner}
                cancelRewardRound={cancelRewardRound}
                completeRewardRound={completeRewardRound}
              />
            )}

          {activeRewardRound.status === "completed" && (
            <Button
              type="button"
              variant="session-action"
              fullWidth={false}
              disabled={busy}
              onClick={() => void returnFromRewardRound()}
            >
              Return everyone to game
            </Button>
          )}
        </div>
      )}

      {session.status !== "live" && !activeRewardRound && (
        <Note variant="session">
          Start the game before opening a reward flow. Reward methods enabled in
          setup:{" "}
          {enabledRewardMethods.map(rewardMethodLabel).join(", ") || "none"}.
        </Note>
      )}
    </ContentPanel>
  );
  if (!showRewardOverlay) return content;
  return (
    <Dialog
      label="Review points and voting"
      dismissDisabled={busy}
      onClose={() => setShowRewardOverlay(false)}
    >
      {content}
    </Dialog>
  );
}
