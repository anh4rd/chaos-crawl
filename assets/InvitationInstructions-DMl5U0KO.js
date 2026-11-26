var e=`import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import DisplayHeading from "../../components/ui/DisplayHeading";
import Icon from "../../components/ui/Icon";
import InstructionStep from "../../components/ui/InstructionStep";

export default function InvitationInstructions({
  demoEnabled,
  onDemo,
}: {
  demoEnabled: boolean;
  onDemo: () => void;
}) {
  return (
    <Card as="section" variant="poster" className="invitation-instructions">
      <div className="invitation-instructions__heading">
        <Icon name="gamepad2" className="icon--size-24" />
        <DisplayHeading>How to play</DisplayHeading>
      </div>
      <div className="invitation-instructions__steps">
        <InstructionStep number="01" title="Join your team">
          Use your invite link, choose a name and get ready.
        </InstructionStep>
        <InstructionStep number="02" title="Take on challenges">
          Complete silly tasks, upload evidence when asked and collect points.
        </InstructionStep>
        <InstructionStep number="03" title="Vote and win">
          Take part in reward rounds and help decide the favourites.
        </InstructionStep>
      </div>
      {demoEnabled && (
        <Button variant="poster-secondary" fullWidth={false} onClick={onDemo}>
          <Icon name="play" className="icon--size-17" /> Take the interactive
          game tour
        </Button>
      )}
    </Card>
  );
}
`;export{e as default};