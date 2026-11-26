var e=`import IconButton from "../../components/ui/IconButton";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Note from "../../components/ui/Note";
import ContentCopy from "../../components/ui/ContentCopy";
import IconBadge from "../../components/ui/IconBadge";
import ControlRow from "../../components/ui/ControlRow";
import Badge from "../../components/ui/Badge";
import Overline from "../../components/ui/Overline";
import PanelHeading from "../../components/ui/PanelHeading";
import ContentPanel from "../../components/ui/ContentPanel";
import Icon from "../../components/ui/Icon";
import type { UpcomingChallengeModel } from "./types";

export default function UpcomingChallenge({
  scheduledChallenge,
  nextChallenge,
  scheduledTime,
  busy,
  revealingNext,
  scheduleMinutes,
  onRevealNext,
  onCancelSchedule,
  onScheduleMinutesChange,
  onScheduleNext,
}: UpcomingChallengeModel) {
  return (
    <ContentPanel variant="console-white">
      <PanelHeading variant="console">
        <Overline variant="console">
          <Icon name="arrow-right" className="icon--size-14" /> NEXT
        </Overline>
        {scheduledTime && (
          <Badge variant="console-scheduled">
            <Icon name="clock3" className="icon--size-13" /> {scheduledTime}
          </Badge>
        )}
      </PanelHeading>
      {scheduledChallenge ? (
        <ControlRow variant="console-preview">
          <IconBadge variant="console-challenge-lime" as="div">
            <Icon name="calendar-clock" className="icon--size-25" />
          </IconBadge>
          <ContentCopy variant="console">
            <h2>{scheduledChallenge.title}</h2>
            <p>{scheduledChallenge.description || "Scheduled challenge"}</p>
            <p className="content-copy__schedule-note">
              Scheduled to reveal
              {scheduledTime ? \` at \${scheduledTime}\` : " soon"}.
            </p>
          </ContentCopy>
        </ControlRow>
      ) : nextChallenge ? (
        <ControlRow variant="console-preview">
          <IconBadge variant="console-challenge-lime" as="div">
            <Icon name="circle-dot" className="icon--size-25" />
          </IconBadge>
          <ContentCopy variant="console">
            <h2>{nextChallenge.title}</h2>
            <p>
              {nextChallenge.description ||
                "No extra instructions for this challenge."}
            </p>
            <Note variant="console-points" as="span">
              +{nextChallenge.points} points
            </Note>
          </ContentCopy>
        </ControlRow>
      ) : (
        <EmptyState variant="console">
          <h2>All rounds revealed</h2>
          <p>You've reached the end of the main challenge list.</p>
        </EmptyState>
      )}
      <ControlRow variant="console-actions">
        {nextChallenge && (
          <Button
            type="button"
            fullWidth={false}
            variant="console-primary"
            disabled={busy}
            onClick={onRevealNext}
          >
            {revealingNext ? "Revealing…" : "Reveal next challenge"}
            <Icon name="chevron-right" className="icon--size-17" />
          </Button>
        )}
        {scheduledChallenge && (
          <Button
            type="button"
            fullWidth={false}
            variant="console-subtle"
            disabled={busy}
            onClick={onCancelSchedule}
          >
            <Icon name="x" className="icon--size-16" /> Cancel schedule
          </Button>
        )}
      </ControlRow>
      {nextChallenge && !scheduledChallenge && (
        <ControlRow variant="console-schedule">
          <label htmlFor="host-v2-schedule">Auto-reveal in</label>
          <input
            id="host-v2-schedule"
            aria-label="Minutes until auto reveal"
            type="number"
            min={1}
            max={240}
            value={scheduleMinutes}
            onChange={(event) => onScheduleMinutesChange(event.target.value)}
          />
          <span>min</span>
          <IconButton
            type="button"

            variant="console-square"
            disabled={busy}
            label="Schedule next challenge"
            onClick={onScheduleNext}
            icon="calendar-clock"
            iconClassName="icon--size-17"
          />
        </ControlRow>
      )}
    </ContentPanel>
  );
}
`;export{e as default};