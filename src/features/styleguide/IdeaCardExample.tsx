import { useState } from "react";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { Example } from "./Example";
import HostPatternPreview from "./HostPatternPreview";

export default function IdeaCardExample() {
  const [selected, setSelected] = useState(false);
  return (
    <Example
      title="Shared idea card"
      source="src/components/ui/Card.tsx"
      code={
        '<Card as="article" variant="idea" header={<Badge variant="idea-main">Main challenge</Badge>}>…</Card>'
      }
    >
      <HostPatternPreview>
        <Card
          as="article"
          variant="idea"
          header={<Badge variant="idea-main">Main challenge</Badge>}
        >
          <h3>A reusable idea</h3>
          <p>A shared surface with a caller-composed header and content.</p>
          <Button
            type="button"
            variant="comic-primary"
            fullWidth={false}
            onClick={() => setSelected(true)}
          >
            Choose locally
          </Button>
        </Card>
      </HostPatternPreview>
      <HostPatternPreview>
        <Badge variant="idea">Idea</Badge>{" "}
        <Badge variant="idea-main">Main challenge</Badge>{" "}
        <Badge variant="idea-side">Side challenge</Badge>{" "}
        <Badge variant="idea-secret">Secret mission</Badge>{" "}
        <Badge variant="idea-location">Outdoor idea</Badge>{" "}
        <Badge variant="idea-route">Walking route</Badge>
      </HostPatternPreview>
      <p role="status">
        {selected
          ? "Idea chosen locally."
          : "Choose an idea in this local reference."}
      </p>
    </Example>
  );
}
