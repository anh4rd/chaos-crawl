var e=`import Card from "../../../components/ui/Card";
import DisplayHeading from "../../../components/ui/DisplayHeading";
import Note from "../../../components/ui/Note";
import ControlRow from "../../../components/ui/ControlRow";
import Button from "../../../components/ui/Button";
export default function RoundMovementControls({
  currentPub,
  nextPubName,
  canAdvance,
  onNext,
}: {
  currentPub: string;
  nextPubName?: string;
  canAdvance: boolean;
  onNext: () => Promise<void>;
}) {
  return (
    <Card>
      <DisplayHeading variant="plain-compact">Move Round</DisplayHeading>
      <Note variant="description">
        Current pub: <strong>{currentPub}</strong>
      </Note>
      <Note variant="description">
        Next pub: <strong>{nextPubName ?? "None"}</strong>
      </Note>
      <ControlRow variant="slot">
        <Button type="button" disabled={!canAdvance} onClick={onNext}>
          Move to Next Pub
        </Button>
      </ControlRow>
    </Card>
  );
}
`;export{e as default};