var e=`import StepOutline from "../../components/ui/StepOutline";
import IconButton from "../../components/ui/IconButton";
import MetadataList from "../../components/ui/MetadataList";
import MetadataItem from "../../components/ui/MetadataItem";
import TagList from "../../components/ui/TagList";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";

import type { RouteCardModel } from "./viewTypes";

export default function RouteCard({
  route,
  saved,
  busy,
  expanded,
  onToggleSaved,
  onToggleExpanded,
}: RouteCardModel) {
  return (
    <Card
      as="article"
      variant="idea"
      header={
        <>
          <Badge variant="idea-route">{route.style}</Badge>
          <IconButton
            type="button"
            variant={saved ? "idea-saved" : "idea-save"}
            icon={saved ? "bookmark-check" : "heart"}
            disabled={busy}
            onClick={() => onToggleSaved()}
            label={saved ? \`Unsave \${route.title}\` : \`Save \${route.title}\`}
            title={saved ? "Saved" : "Save for later"}
          />
        </>
      }
    >
      <h3>{route.title}</h3>
      <p>{route.description}</p>
      <MetadataList>
        <MetadataItem icon="clock3">{route.duration}</MetadataItem>
        <MetadataItem icon="wallet">{route.budget} budget</MetadataItem>
        <MetadataItem icon="map-pin">
          {route.stops.length} stops / stages
        </MetadataItem>
      </MetadataList>
      <TagList variant="idea">
        {route.tags.map((tag) => (
          <Badge variant="tag" key={tag}>
            {tag}
          </Badge>
        ))}
      </TagList>
      <Button
        type="button"
        variant="outline-toggle"
        fullWidth={false}
        aria-expanded={expanded}
        onClick={() => onToggleExpanded()}
      >
        {expanded ? "Hide route outline" : "Preview route"}{" "}
        <Icon name="arrow-right" className="icon--size-15" />
      </Button>
      {expanded && (
        <StepOutline
          steps={route.stops.map((stop) => ({
            title: stop,
            detail: "Choose a suitable local place for this stage.",
          }))}
          note={route.note}
        />
      )}
      <Button
        type="button"
        variant="idea-use-secondary"
        fullWidth={false}
        onClick={() => onToggleSaved()}
      >
        {saved ? (
          <>
            <Icon name="check" className="icon--size-16" /> Saved route
          </>
        ) : (
          <>
            <Icon name="heart" className="icon--size-16" /> Save route
          </>
        )}
      </Button>
    </Card>
  );
}
`;export{e as default};