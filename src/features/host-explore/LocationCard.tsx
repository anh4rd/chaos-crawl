import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";

import type { LocationCardModel } from "./viewTypes";

export default function LocationCard({
  location,
  saved,
  busy,
  onToggleSaved,
  onUse,
}: LocationCardModel) {
  return (
    <Card
      as="article"
      variant="idea"
      header={
        <>
          <span className="host-explore-type host-explore-type--location">
            {location.oneVenue ? "Single venue" : "Outdoor idea"}
          </span>
          <button
            type="button"
            className={`host-explore-save${saved ? " is-saved" : ""}`}
            disabled={busy}
            onClick={() => onToggleSaved()}
            aria-label={
              saved ? `Unsave ${location.title}` : `Save ${location.title}`
            }
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
      <h3>{location.title}</h3>
      <p>{location.description}</p>
      <div className="host-explore-metadata">
        <span>
          <Icon name="wallet" className="icon--size-14" />
          {location.cost} cost
        </span>
        <span>
          <Icon name="users" className="icon--size-14" />
          {location.bestFor[0]}
        </span>
      </div>
      <div className="host-explore-tags">
        {location.bestFor.slice(0, 4).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <details className="host-explore-details">
        <summary>Practical checks</summary>
        <ul>
          {location.considerations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </details>
      <Button
        type="button"
        variant="comic-primary"
        fullWidth={false}
        className="host-explore-use"
        onClick={() => onUse()}
      >
        Use this venue idea{" "}
        <Icon name="arrow-right" className="icon--size-15" />
      </Button>
    </Card>
  );
}
