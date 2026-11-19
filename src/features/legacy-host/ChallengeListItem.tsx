import Button from "../../components/ui/Button";
import Note from "../../components/ui/Note";
import Badge from "../../components/ui/Badge";
import ControlRow from "../../components/ui/ControlRow";
import ContentCopy from "../../components/ui/ContentCopy";
import IconBadge from "../../components/ui/IconBadge";
import Icon from "../../components/ui/Icon";
import type { ChallengeListItemModel } from "./types";

export default function ChallengeListItem({
  challenge,
  busy,
}: {
  challenge: ChallengeListItemModel;
  busy: boolean;
}) {
  return (
    <article className="challenge-item">
      <IconBadge variant="console-item" as="div">
        {challenge.past ? (
          <Icon name="check" className="icon--size-17" />
        ) : (
          <Icon name="flag" className="icon--size-17" />
        )}
      </IconBadge>
      <ContentCopy variant="console-list">
        <ControlRow variant="console-title">
          <h3>{challenge.title}</h3>
          {challenge.current && <Badge variant="console-live">Live</Badge>}
          {challenge.scheduled && (
            <Badge variant="console-scheduled">Scheduled</Badge>
          )}
        </ControlRow>
        <p>{challenge.description || "No description added."}</p>
        <Note variant="console-points" as="span">
          +{challenge.points} points
        </Note>
      </ContentCopy>
      <ControlRow variant="console-row-actions">
        <Button
          type="button"
          fullWidth={false}
          variant="console-small"
          disabled={busy || challenge.current}
          onClick={challenge.onReveal}
        >
          {challenge.current ? "Live" : "Reveal"}
        </Button>
        {!challenge.current && !challenge.scheduled && (
          <Button
            type="button"
            fullWidth={false}
            variant="console-quiet"
            disabled={busy}
            onClick={challenge.onSchedule}
          >
            Schedule
          </Button>
        )}
      </ControlRow>
    </article>
  );
}
