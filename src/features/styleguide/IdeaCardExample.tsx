import { useState } from "react";
import Icon from "../../components/ui/Icon";
import IconButton from "../../components/ui/IconButton";
import MetadataList from "../../components/ui/MetadataList";
import MetadataItem from "../../components/ui/MetadataItem";
import TagList from "../../components/ui/TagList";
import Disclosure from "../../components/ui/Disclosure";
import StepOutline from "../../components/ui/StepOutline";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { Example } from "./Example";
import HostPatternPreview from "./HostPatternPreview";

export default function IdeaCardExample() {
  const [notice, setNotice] = useState(
    "Choose an idea in this local reference.",
  );
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
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
          header={
            <>
              <Badge variant="idea-main">Main challenge</Badge>
              <IconButton
                type="button"
                variant={saved ? "idea-saved" : "idea-save"}
                icon={saved ? "bookmark-check" : "heart"}
                label={saved ? "Unsave local idea" : "Save local idea"}
                title={saved ? "Saved" : "Save for later"}
                disabled={busy}
                onClick={() => setSaved(!saved)}
              />
            </>
          }
        >
          <h3>A reusable idea</h3>
          <p>A shared surface with a caller-composed header and content.</p>
          <MetadataList>
            <MetadataItem icon="clock3">6 min</MetadataItem>
            <MetadataItem icon="sparkles">12 points</MetadataItem>
          </MetadataList>
          <TagList variant="idea">
            <Badge variant="tag">Creative</Badge>
            <Badge variant="tag">Teams</Badge>
          </TagList>
          <Disclosure variant="idea" summary="Local practical checks">
            <ul>
              <li>Choose a safe local place.</li>
            </ul>
          </Disclosure>
          <Button
            type="button"
            variant="outline-toggle"
            fullWidth={false}
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Hide local outline" : "Preview local outline"}{" "}
            <Icon name="arrow-right" className="icon--size-15" />
          </Button>
          {expanded && (
            <StepOutline
              steps={[
                {
                  title: "Meet the team",
                  detail: "Pick a local meeting place.",
                },
                {
                  title: "Try a challenge",
                  detail: "Use a locally agreed activity.",
                },
              ]}
              note="This outline only changes local preview state."
            />
          )}
          <Button
            type="button"
            variant="idea-use"
            fullWidth={false}
            onClick={() => setNotice("Idea chosen locally.")}
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
      <label>
        <input
          type="checkbox"
          checked={busy}
          onChange={(event) => setBusy(event.target.checked)}
        />
        Simulate local idea pending
      </label>
      <IconButton
        type="button"
        variant="idea-close"
        icon="x"
        label="Close local preview"
        onClick={() => setNotice("Preview close requested.")}
      />
      <p role="status">{notice}</p>
    </Example>
  );
}
