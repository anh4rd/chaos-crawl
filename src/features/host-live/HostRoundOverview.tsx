import Badge from "../../components/ui/Badge";
import RoundNumber from "../../components/session/RoundNumber";
import RoundSelector from "../../components/session/RoundSelector";
import UpcomingChallenge from "../../components/session/UpcomingChallenge";
import ContentPanel from "../../components/ui/ContentPanel";
import Overline from "../../components/ui/Overline";
import RoundFlowControls from "../../components/session/RoundFlowControls";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import type {
  GameSession,
  SessionRewardRound as HostRewardRoundData,
  RewardMethod,
  SessionChallenge,
} from "./types";

interface Props {
  session: GameSession;
  mainRounds: SessionChallenge[];
  currentChallenge: SessionChallenge | undefined;
  busy: boolean;
  requestMoveToRound: (nextRound: number) => void;
  activeRewardRound: HostRewardRoundData | null;
  roundTimerHydrated: boolean;
  hostBreakActive: boolean;
  currentRoundPointsAwarded: boolean;
  enabledRewardMethods: RewardMethod[];
  openPointReview: () => void;
  skipTimerAndReview: () => void;
  roundClockRunning: boolean;
  breakResumeRound: number | null;
  requestStartBreak: () => void;
  runStartRoundControl: () => void;
  roundClockSeconds: number;
  restartRoundTimer: () => void;
  nextBreakChallenge: SessionChallenge | undefined;
  openBreakChallengeEditor: (challenge: SessionChallenge) => void;
  finishGame: () => Promise<void>;
}
export default function HostRoundOverview({
  session,
  mainRounds,
  currentChallenge,
  busy,
  requestMoveToRound,
  activeRewardRound,
  roundTimerHydrated,
  hostBreakActive,
  currentRoundPointsAwarded,
  enabledRewardMethods,
  openPointReview,
  skipTimerAndReview,
  roundClockRunning,
  breakResumeRound,
  requestStartBreak,
  runStartRoundControl,
  roundClockSeconds,
  restartRoundTimer,
  nextBreakChallenge,
  openBreakChallengeEditor,
  finishGame,
}: Props) {
  return (
    <ContentPanel
      variant="session"
      className="host-round-overview"
      data-tour="host-start-controls"
    >
      <Overline as="div" variant="session" tone="pink">
        GAME CONTROL
      </Overline>
      {session.status === "completed" ? (
        <>
          <h2>Game complete!</h2>
          <p>
            This session is saved separately from every other game. You can
            still review the rounds and scores below.
          </p>
        </>
      ) : (
        <>
          <Badge as="div" variant="round">
            CURRENT ROUND
          </Badge>
          <RoundNumber
            round={session.current_round_number}
            total={mainRounds.length}
          />
          <h2>{currentChallenge?.title ?? "Round not found"}</h2>
          <p>
            {currentChallenge?.description ??
              "Check that the saved plan contains a main challenge for this round."}
          </p>
          <div className="host-round-overview__actions">
            <Button
              type="button"
              variant="round-secondary"
              fullWidth={false}
              disabled={busy || session.current_round_number <= 1}
              onClick={() =>
                requestMoveToRound(session.current_round_number - 1)
              }
            >
              <Icon name="rotate-ccw" className="icon--size-16" /> Previous
              round
            </Button>
            <Button
              type="button"
              variant="round-primary"
              fullWidth={false}
              disabled={
                busy || session.current_round_number >= mainRounds.length
              }
              onClick={() =>
                requestMoveToRound(session.current_round_number + 1)
              }
            >
              Next round <Icon name="arrow-right" className="icon--size-16" />
            </Button>
          </div>
          <RoundSelector
            rounds={mainRounds.map((round) => ({
              id: round.id,
              round: round.round_number,
              title: round.title,
            }))}
            currentRound={session.current_round_number}
            busy={busy}
            onSelect={requestMoveToRound}
          />
          {session.status === "live" && (
            <RoundFlowControls
              heading="FALLBACK CONTROLS"
              label="Quick game flow controls"
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
              onReview={
                activeRewardRound ? openPointReview : skipTimerAndReview
              }
              onNext={() =>
                requestMoveToRound(session.current_round_number + 1)
              }
            >
              {!activeRewardRound && (
                <Button
                  type="button"
                  variant="flow-action"
                  fullWidth={false}
                  disabled={
                    busy ||
                    !roundTimerHydrated ||
                    (hostBreakActive && !breakResumeRound) ||
                    (currentRoundPointsAwarded &&
                      session.current_round_number >= mainRounds.length)
                  }
                  onClick={
                    hostBreakActive
                      ? () =>
                          requestMoveToRound(
                            breakResumeRound ??
                              session.current_round_number + 1,
                          )
                      : currentRoundPointsAwarded
                        ? requestStartBreak
                        : roundClockRunning
                          ? runStartRoundControl
                          : roundClockSeconds === 0
                            ? restartRoundTimer
                            : runStartRoundControl
                  }
                >
                  {!roundTimerHydrated ? (
                    "Loading timer…"
                  ) : hostBreakActive ? (
                    "Start next round"
                  ) : currentRoundPointsAwarded ? (
                    <>
                      <Icon name="coffee" className="icon--size-13" /> Take a
                      break
                    </>
                  ) : roundClockRunning ? (
                    <>
                      <Icon name="pause" className="icon--size-13" /> Pause
                      timer
                    </>
                  ) : roundClockSeconds === 0 ? (
                    <>
                      <Icon name="rotate-ccw" className="icon--size-13" />{" "}
                      Restart timer
                    </>
                  ) : (
                    <>
                      <Icon name="play" className="icon--size-13" /> Start timer
                    </>
                  )}
                </Button>
              )}
            </RoundFlowControls>
          )}
          {nextBreakChallenge && (
            <UpcomingChallenge
              round={nextBreakChallenge.round_number}
              title={nextBreakChallenge.title}
              description={nextBreakChallenge.description}
              minutes={nextBreakChallenge.duration_minutes}
              points={nextBreakChallenge.points}
              evidenceRequired={nextBreakChallenge.allow_photo_upload}
            >
              <Button
                variant="session-edit"
                fullWidth={false}
                type="button"

                disabled={busy}
                onClick={() => openBreakChallengeEditor(nextBreakChallenge)}
              >
                <Icon name="pencil" className="icon--size-14" /> Edit next
                challenge
              </Button>
            </UpcomingChallenge>
          )}
          <Button
            type="button"
            variant="round-finish"
            fullWidth={false}
            disabled={busy}
            onClick={() => void finishGame()}
          >
            <Icon name="flag" className="icon--size-16" /> Finish game
          </Button>
        </>
      )}
    </ContentPanel>
  );
}
