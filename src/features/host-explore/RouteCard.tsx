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
          <button
            type="button"
            className={`host-explore-save${saved ? " is-saved" : ""}`}
            disabled={busy}
            onClick={() => onToggleSaved()}
            aria-label={saved ? `Unsave ${route.title}` : `Save ${route.title}`}
            title={saved ? "Saved" : "Save for later"}
          >
            {saved ? (
              <Icon name="bookmark-check" className="icon--size-18" />
            ) : (
              <Icon name="heart" className="icon--size-18" />
            )}
          </button>
        </>
      }
    >
      <h3>{route.title}</h3>
      <p>{route.description}</p>
      <div className="host-explore-metadata">
        <span>
          <Icon name="clock3" className="icon--size-14" />
          {route.duration}
        </span>
        <span>
          <Icon name="wallet" className="icon--size-14" />
          {route.budget} budget
        </span>
        <span>
          <Icon name="map-pin" className="icon--size-14" />
          {route.stops.length} stops / stages
        </span>
      </div>
      <div className="host-explore-tags">
        {route.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <button
        type="button"
        className="host-explore-route-toggle"
        aria-expanded={expanded}
        onClick={() => onToggleExpanded()}
      >
        {expanded ? "Hide route outline" : "Preview route"}{" "}
        <Icon name="arrow-right" className="icon--size-15" />
      </button>
      {expanded && (
        <div className="host-explore-route-outline">
          <ol>
            {route.stops.map((stop, index) => (
              <li key={stop}>
                <span>{index + 1}</span>
                <div>
                  <strong>{stop}</strong>
                  <small>Choose a suitable local place for this stage.</small>
                </div>
              </li>
            ))}
          </ol>
          <p>{route.note}</p>
        </div>
      )}
      <Button
        type="button"
        variant="comic-secondary"
        fullWidth={false}
        className="host-explore-use"
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
