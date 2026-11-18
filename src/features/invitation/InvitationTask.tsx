import PosterCopy from "../../components/ui/PosterCopy";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import DisplayHeading from "../../components/ui/DisplayHeading";

export default function InvitationTask({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card as="section" variant="poster" accent>
      <Badge>BEFORE THE EVENT</Badge>
      <DisplayHeading>{title}</DisplayHeading>
      <PosterCopy>{description}</PosterCopy>
      <small>Your host may ask you to complete this before the event.</small>
    </Card>
  );
}
