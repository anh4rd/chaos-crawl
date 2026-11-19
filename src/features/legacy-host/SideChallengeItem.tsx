import Button from "../../components/ui/Button";
import Note from "../../components/ui/Note";
import ControlRow from "../../components/ui/ControlRow";
import Badge from "../../components/ui/Badge";
import PanelHeading from "../../components/ui/PanelHeading";
import ContentPanel from "../../components/ui/ContentPanel";
import type { SideChallengeItemModel } from "./types";

export default function SideChallengeItem({
  challenge,
}: {
  challenge: SideChallengeItemModel;
}) {
  return (
    <ContentPanel variant="console-card" as="article">
      <PanelHeading variant="console-card">
        <h3>{challenge.title}</h3>
        <Badge variant="console-points">+{challenge.points} pts</Badge>
      </PanelHeading>
      <p>{challenge.description}</p>
      <ControlRow variant="console-card-actions">
        <Note variant="console-muted" as="span">
          {challenge.completionCount} completions recorded
        </Note>
        <Button
          type="button"
          fullWidth={false}
          variant="console-small"
          onClick={challenge.onReview}
        >
          Review
        </Button>
      </ControlRow>
    </ContentPanel>
  );
}
