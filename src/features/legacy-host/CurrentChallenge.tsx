import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";
import ContentCopy from "../../components/ui/ContentCopy";
import IconBadge from "../../components/ui/IconBadge";
import ControlRow from "../../components/ui/ControlRow";
import Badge from "../../components/ui/Badge";
import Overline from "../../components/ui/Overline";
import PanelHeading from "../../components/ui/PanelHeading";
import ContentPanel from "../../components/ui/ContentPanel";
import Icon from "../../components/ui/Icon";
import type { CurrentChallengeModel } from "./types";

export default function CurrentChallenge({
  currentChallenge,
  submissionCount,
  onReview,
}: CurrentChallengeModel) {
  return (
    <ContentPanel variant="console-white">
      <PanelHeading variant="console">
        <Overline variant="console">
          <Icon name="radio" className="icon--size-14" /> NOW
        </Overline>
        {currentChallenge && (
          <Badge variant="console-live">Live challenge</Badge>
        )}
      </PanelHeading>
      {currentChallenge ? (
        <>
          <ControlRow variant="console-preview">
            <IconBadge variant="console-challenge" as="div">
              <Icon name="flag" className="icon--size-28" />
            </IconBadge>
            <ContentCopy variant="console">
              <h2>{currentChallenge.title}</h2>
              <p>
                {currentChallenge.description ||
                  "No extra instructions for this challenge."}
              </p>
            </ContentCopy>
            <Badge variant="console-points">
              +{currentChallenge.points} pts
            </Badge>
          </ControlRow>
          <ControlRow variant="console-meta">
            <span>
              <Icon name="check-circle2" className="icon--size-15" />{" "}
              {submissionCount} {"submissions"}
            </span>
            <Button
              type="button"
              fullWidth={false}
              variant="console-text"
              onClick={onReview}
            >
              {"Review"} <Icon name="chevron-right" className="icon--size-16" />
            </Button>
          </ControlRow>
        </>
      ) : (
        <EmptyState variant="console">
          <h2>No challenge is live yet</h2>
          <p>Reveal the first challenge when everyone is ready.</p>
        </EmptyState>
      )}
    </ContentPanel>
  );
}
