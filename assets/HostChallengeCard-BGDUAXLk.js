var e=`import Badge from "../../../components/ui/Badge";
import Overline from "../../../components/ui/Overline";
import Note from "../../../components/ui/Note";
import DisplayHeading from "../../../components/ui/DisplayHeading";
import ControlRow from "../../../components/ui/ControlRow";
import ContentPanel from "../../../components/ui/ContentPanel";
import Button from "../../../components/ui/Button";
import ChallengeActions, {
  type ChallengeParticipation,
} from "../../game/ChallengeActions";
import type { Player, SideChallenge } from "../../../types/database";
export default function HostChallengeCard({
  challenge,
  completedBy,
  participation,
  onReview,
}: {
  challenge: SideChallenge;
  completedBy: Player[];
  participation: ChallengeParticipation;
  onReview: () => void;
}) {
  const completed = participation.hasCompleted("side", challenge.id);
  return (
    <ContentPanel
      aria-label={challenge.title}
      as="section"
      variant="challenge"
      state={completed ? "complete" : undefined}
    >
      <ControlRow variant="spread">
        <div>
          <DisplayHeading as="h3" variant="plain-body">
            {challenge.title}
          </DisplayHeading>
          {challenge.description && (
            <Note variant="secondary">{challenge.description}</Note>
          )}
        </div>
        <strong>+{challenge.points}</strong>
      </ControlRow>
      {completed ? (
        <Note variant="success">✓ Completed</Note>
      ) : (
        <>
          <ChallengeActions
            challenge={{
              id: challenge.id,
              title: challenge.title,
              points: challenge.points,
              type: "side",
            }}
            allowMedia
            participation={participation}
          />
          <ControlRow variant="slot-close">
            <Button type="button" onClick={onReview}>
              Review & Award Points
            </Button>
          </ControlRow>
        </>
      )}
      <ControlRow variant="slot">
        <Overline as="p" variant="plain">
          Completed by
        </Overline>
        {completedBy.length === 0 ? (
          <Note variant="quiet">Nobody yet</Note>
        ) : (
          <ControlRow variant="chips-close">
            {completedBy.map((player) => (
              <Badge key={player.id} variant="completion">
                ✓ {player.name}
              </Badge>
            ))}
          </ControlRow>
        )}
      </ControlRow>
    </ContentPanel>
  );
}
`;export{e as default};