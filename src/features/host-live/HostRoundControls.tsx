import IconButton from "../../components/ui/IconButton";
import Button from "../../components/ui/Button";
import ControlRow from "../../components/ui/ControlRow";
import Note from "../../components/ui/Note";
import TimerReadout from "../../components/ui/TimerReadout";
import RoundFlowControls from "../../components/session/RoundFlowControls";
import ControlPanel from "../../components/ui/ControlPanel";
import Icon from "../../components/ui/Icon";
import type {
  GameSession,
  SessionRewardRound as HostRewardRoundData,
  RewardMethod,
  SessionChallenge,
} from "./types";

interface Props {
  session: GameSession;
  activeRewardRound: HostRewardRoundData | null;
  openPointReview: () => void;
  hostBreakActive: boolean;
  currentRoundPointsAwarded: boolean;
  roundClockText: string;
  busy: boolean;
  moveToRound: (
    nextRound: number,
    confirmedOverride?: boolean,
    forceBreakMinutes?: number,
  ) => void;
  breakResumeRound: number | null;
  openBreakTimerEditor: () => void;
  requestMoveToRound: (nextRound: number) => void;
  mainRounds: SessionChallenge[];
  requestStartBreak: () => void;
  roundTimerHydrated: boolean;
  roundClockSeconds: number;
  roundClockRunning: boolean;
  restartRoundTimer: () => void;
  enabledRewardMethods: RewardMethod[];
  startGameOrToggleTimer: () => void;
  resetRoundTimer: () => void;
  skipTimerAndReview: () => void;
}
export default function HostRoundControls({
  session,
  activeRewardRound,
  openPointReview,
  hostBreakActive,
  currentRoundPointsAwarded,
  roundClockText,
  busy,
  moveToRound,
  breakResumeRound,
  openBreakTimerEditor,
  requestMoveToRound,
  mainRounds,
  requestStartBreak,
  roundTimerHydrated,
  roundClockSeconds,
  roundClockRunning,
  restartRoundTimer,
  enabledRewardMethods,
  startGameOrToggleTimer,
  resetRoundTimer,
  skipTimerAndReview,
}: Props) {
  return (
    <ControlPanel
      className="host-round-controls"
      heading="HOST CONTROLS"
      marker="✦"
      aria-label="Host controls"
      data-tour="host-controls-tab"
    >
      {session.status === "completed" ? (
        <Note variant="control">
          Game complete. Your players can review the final scores.
        </Note>
      ) : activeRewardRound ? (
        <div className="host-round-controls__stage">
          <Note variant="control">
            Reward points are in progress. Continue the review to return
            everyone to the game.
          </Note>
          <Button
            type="button"
            variant="control-primary"
            fullWidth={false}
            onClick={openPointReview}
          >
            <Icon name="trophy" className="icon--size-17" /> Continue reward
            flow
          </Button>
        </div>
      ) : hostBreakActive ? (
        <div className="host-round-controls__stage">
          <Note variant="control">
            {currentRoundPointsAwarded
              ? "Points awarded! Move to the next round when you are ready."
              : "Break in progress. The next round starts when the timer ends."}
          </Note>
          <h3 className="host-round-controls__break-heading">
            NEXT ROUND STARTS IN...
          </h3>
          <ControlRow variant="break">
            <TimerReadout label="TIME REMAINING" value={roundClockText} />
            <Button
              type="button"
              variant="control-primary"
              fullWidth={false}
              disabled={busy}
              onClick={() =>
                void moveToRound(
                  breakResumeRound ?? session.current_round_number + 1,
                )
              }
            >
              <Icon name="play" className="icon--size-16" /> Start Now
            </Button>
            <Button
              type="button"
              variant="timer-menu"
              fullWidth={false}
              aria-label="Edit break timer"
              title="Edit break timer"
              disabled={busy}
              onClick={openBreakTimerEditor}
            >
              ⋮
            </Button>
          </ControlRow>
        </div>
      ) : currentRoundPointsAwarded ? (
        <div className="host-round-controls__stage">
          <Note variant="control">
            Points awarded! Move to the next round when you are ready.
          </Note>
          <div className="host-round-controls__actions host-round-controls__actions--progress">
            <Button
              type="button"
              variant="control"
              fullWidth={false}
              disabled={busy || session.current_round_number <= 1}
              onClick={() =>
                requestMoveToRound(session.current_round_number - 1)
              }
            >
              <Icon name="arrow-left" className="icon--size-16" /> Previous
              Round
            </Button>
            <Button
              type="button"
              variant="control"
              fullWidth={false}
              disabled={
                busy || session.current_round_number >= mainRounds.length
              }
              onClick={requestStartBreak}
            >
              <span className="host-round-controls__pause-symbol">Ⅱ</span> Take
              a Break
            </Button>
            <Button
              type="button"
              variant="control-primary"
              fullWidth={false}
              className="host-round-controls__next"
              disabled={
                busy || session.current_round_number >= mainRounds.length
              }
              onClick={() =>
                requestMoveToRound(session.current_round_number + 1)
              }
            >
              Next Round <Icon name="arrow-right" className="icon--size-16" />
            </Button>
          </div>
        </div>
      ) : !roundTimerHydrated ? (
        <Note variant="control">Preparing the round timer…</Note>
      ) : roundClockSeconds === 0 && !roundClockRunning ? (
        <div className="host-round-controls__stage">
          <Note variant="control">
            Challenge complete! Review points when you are ready.
          </Note>
          <ControlRow variant="timer">
            <TimerReadout label="TIME REMAINING" value={roundClockText} />
            <IconButton
              type="button"
              variant="control-replay"
              icon="rotate-ccw"
              iconClassName="icon--size-20"
              label="Play timer again"
              title="Play timer again"
              disabled={busy}
              onClick={restartRoundTimer}
            />
          </ControlRow>
          <Button
            type="button"
            variant="control-primary"
            fullWidth={false}
            className="host-round-controls__review"
            disabled={busy || enabledRewardMethods.length === 0}
            onClick={openPointReview}
          >
            <Icon name="trophy" className="icon--size-17" /> Review and award
          </Button>
        </div>
      ) : roundClockRunning ? (
        <div className="host-round-controls__stage">
          <ControlRow variant="timer">
            <TimerReadout label="TIME REMAINING" value={roundClockText} />
            <Button
              type="button"
              variant="control"
              fullWidth={false}
              disabled={busy}
              onClick={startGameOrToggleTimer}
            >
              <Icon name="pause" className="icon--size-19" /> Pause
            </Button>
            <IconButton
              type="button"
              variant="control-replay"
              icon="rotate-ccw"
              iconClassName="icon--size-20"
              label="Redo timer"
              title="Redo timer"
              disabled={busy}
              onClick={resetRoundTimer}
            />
          </ControlRow>
        </div>
      ) : (
        <div className="host-round-controls__stage">
          <Note variant="control">
            When you are ready to play, start the timer.
          </Note>
          <ControlRow variant="timer">
            <TimerReadout label="TIME REMAINING" value={roundClockText} />
            <Button
              type="button"
              variant="control-primary"
              fullWidth={false}
              disabled={busy}
              onClick={startGameOrToggleTimer}
            >
              <Icon name="play" className="icon--size-17" /> Start Timer
            </Button>
          </ControlRow>
        </div>
      )}
      {session.status === "live" && (
        <RoundFlowControls
          heading="BACKUP FLOW CONTROLS"
          label="Fallback round controls"
          busy={busy}
          rewardActive={Boolean(activeRewardRound)}
          currentRound={session.current_round_number}
          totalRounds={mainRounds.length}
          timerReady={roundTimerHydrated}
          onBreak={hostBreakActive}
          roundAwarded={currentRoundPointsAwarded}
          canReward={enabledRewardMethods.length > 0}
          timerRunning={roundClockRunning}
          onPrevious={() =>
            requestMoveToRound(session.current_round_number - 1)
          }
          onReview={activeRewardRound ? openPointReview : skipTimerAndReview}
          onNext={() => requestMoveToRound(session.current_round_number + 1)}
        />
      )}
    </ControlPanel>
  );
}
