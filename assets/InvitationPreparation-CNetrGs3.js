var e=`import Card from "../../components/ui/Card";
import DisplayHeading from "../../components/ui/DisplayHeading";
import PreparationItem from "./PreparationItem";
import type { InviteData } from "./types";

export default function InvitationPreparation({
  items,
}: {
  items: InviteData["preparation"];
}) {
  return (
    <Card as="section" variant="poster">
      <DisplayHeading>What to prepare</DisplayHeading>
      {items.map((item, i) => (
        <PreparationItem key={\`\${item.title}-\${i}\`} {...item} />
      ))}
    </Card>
  );
}
`;export{e as default};