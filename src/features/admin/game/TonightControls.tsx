import { useId } from "react";
import PanelGrid from "../../../components/ui/PanelGrid";
import ContentPanel from "../../../components/ui/ContentPanel";
import FormLabel from "../../../components/ui/FormLabel";
import ControlRow from "../../../components/ui/ControlRow";
import Note from "../../../components/ui/Note";
import DisplayHeading from "../../../components/ui/DisplayHeading";
import Overline from "../../../components/ui/Overline";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import type { Challenge, GameState, Pub } from "../../../types/database";
import Input from "../../../components/ui/Input";
export interface TonightControlsProps {
  game: GameState;
  openVoting: () => Promise<void>;
  closeVoting: () => Promise<void>;
  nextRoundChallenge: Challenge | undefined;
  revealRoundChallenge: (challenge: Challenge) => Promise<void>;
  nextPub: Pub | undefined;
  moveToNextPub: () => Promise<void>;
  returnEveryoneToGame: () => Promise<void>;
  scheduleMinutes: string;
  setScheduleMinutes: (value: string) => void;
  cancelScheduledReveal: () => Promise<void>;
  currentRoundChallenges: Challenge[];
  scheduleChallenge: (challenge: Challenge) => Promise<void>;
  startSlideshow: () => Promise<void>;
  stopSlideshow: () => Promise<void>;
}
export default function TonightControls({
  game,
  openVoting,
  closeVoting,
  nextRoundChallenge,
  revealRoundChallenge,
  nextPub,
  moveToNextPub,
  returnEveryoneToGame,
  scheduleMinutes,
  setScheduleMinutes,
  cancelScheduledReveal,
  currentRoundChallenges,
  scheduleChallenge,
  startSlideshow,
  stopSlideshow,
}: TonightControlsProps) {
  const minutesId = useId();
  return (
    <>
      <Card>
        <Overline as="p" variant="plain-accent">
          Live right now
        </Overline>

        <DisplayHeading variant="plain-stat">{game.current_pub}</DisplayHeading>

        <Note variant="summary">
          {game.current_challenge || "No live challenge"}
        </Note>

        <ControlRow variant="single-actions-loose">
          {nextRoundChallenge && (
            <Button
              type="button"
              onClick={() => revealRoundChallenge(nextRoundChallenge)}
            >
              ⚡ Reveal Next Challenge
            </Button>
          )}

          <Button type="button" disabled={!nextPub} onClick={moveToNextPub}>
            📍 Move to Next Pub
          </Button>

          <Button type="button" onClick={returnEveryoneToGame}>
            ↩ Return Everyone to Game
          </Button>
        </ControlRow>
      </Card>

      <Card>
        <DisplayHeading variant="plain">Schedule a Reveal</DisplayHeading>

        <Note variant="description">
          Keep a game or host screen open and connected until reveal time.
          Background tabs may reveal late.
        </Note>

        <FormLabel variant="plain-strong" htmlFor={minutesId}>
          Reveal in minutes
        </FormLabel>

        <Input
          id={minutesId}
          value={scheduleMinutes}
          onChange={(event) => setScheduleMinutes(event.target.value)}
        />

        {game.scheduled_reveal_at && (
          <ContentPanel as="div" variant="scheduled">
            <Note variant="schedule">
              Scheduled for{" "}
              {new Date(game.scheduled_reveal_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Note>

            <Button type="button" onClick={cancelScheduledReveal}>
              Cancel Scheduled Reveal
            </Button>
          </ContentPanel>
        )}

        <PanelGrid variant="feed-tight">
          {currentRoundChallenges.map((challenge) => (
            <ContentPanel key={challenge.id} as="div" variant="ledger">
              <strong>{challenge.title}</strong>

              <ControlRow variant="slot-tight">
                <Button
                  type="button"
                  onClick={() => scheduleChallenge(challenge)}
                >
                  ⏰ Schedule This
                </Button>
              </ControlRow>
            </ContentPanel>
          ))}
        </PanelGrid>
      </Card>

      <Card>
        <DisplayHeading variant="plain">Emergency Controls</DisplayHeading>

        <ControlRow variant="single-actions">
          {!game.slideshow_open ? (
            <Button type="button" onClick={startSlideshow}>
              📺 Start Slideshow
            </Button>
          ) : (
            <Button type="button" onClick={stopSlideshow}>
              ⛔ End Slideshow
            </Button>
          )}

          {!game.voting_open ? (
            <Button type="button" onClick={openVoting}>
              🗳️ Open Voting
            </Button>
          ) : (
            <Button type="button" onClick={closeVoting}>
              🏁 Close Voting & Show Results
            </Button>
          )}
        </ControlRow>
      </Card>
    </>
  );
}
