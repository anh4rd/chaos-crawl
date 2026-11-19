import { useState } from "react";
import Badge from "../../components/ui/Badge";
import BrandLink from "../../components/ui/BrandLink";
import Button from "../../components/ui/Button";
import ButtonLink from "../../components/ui/ButtonLink";
import Card from "../../components/ui/Card";
import DisplayHeading from "../../components/ui/DisplayHeading";
import InstructionStep from "../../components/ui/InstructionStep";
import PosterCopy from "../../components/ui/PosterCopy";
import { Example } from "./Example";

export default function PosterExamples() {
  const [ready, setReady] = useState(false);
  return (
    <Example
      title="Poster surfaces, badges and typography"
      source="src/components/ui/Card.tsx + Badge.tsx + DisplayHeading.tsx"
      code={
        '<Card variant="poster" as="section">\n  <DisplayHeading>Ready for the event?</DisplayHeading>\n  <Badge variant="metadata" icon="users">12 players</Badge>\n  <PosterCopy>Use the poster copy style.</PosterCopy>\n  <InstructionStep number="01" title="Get ready">Bring your team.</InstructionStep>\n  <Button variant="poster-primary" fullWidth={false}>Join</Button>\n</Card>'
      }
    >
      <Card variant="poster" as="section">
        <BrandLink>CHAOS CRAWL</BrandLink>
        <DisplayHeading>Ready for the event?</DisplayHeading>
        <Badge variant="sticker">YOU'RE INVITED!</Badge>{" "}
        <Badge>LOCAL PREVIEW</Badge>
        <PosterCopy>
          <Badge variant="metadata" icon="users">
            12 demo players
          </Badge>
        </PosterCopy>
        <InstructionStep number="01" title="Get ready">
          Bring your team and get ready for a memorable event.
        </InstructionStep>
        <PosterCopy>
          {ready ? "Your demo team is ready." : "Try the local ready action."}
        </PosterCopy>
        <Button
          type="button"
          variant="poster-primary"
          fullWidth={false}
          onClick={() => setReady((value) => !value)}
        >
          {ready ? "Demo team ready" : "Mark demo team ready"}
        </Button>{" "}
        <ButtonLink
          variant="poster-secondary"
          fullWidth={false}
          to="/styleguide"
        >
          Keep exploring
        </ButtonLink>
      </Card>
    </Example>
  );
}
