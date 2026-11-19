import PosterCopy from "../../components/ui/PosterCopy";
import Card from "../../components/ui/Card";
import DisplayHeading from "../../components/ui/DisplayHeading";

export default function InvitationRules({ rules }: { rules: string }) {
  return (
    <Card as="section" variant="poster" className="invitation-rules">
      <DisplayHeading>The rules</DisplayHeading>
      <PosterCopy className="invitation-rules__copy">{rules}</PosterCopy>
    </Card>
  );
}
