import Disclosure from "../../components/ui/Disclosure";
import IconButton from "../../components/ui/IconButton";
import MetadataList from "../../components/ui/MetadataList";
import MetadataItem from "../../components/ui/MetadataItem";
import TagList from "../../components/ui/TagList";
import Badge from "../../components/ui/Badge";
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
          <Badge variant="idea-location">
            {location.oneVenue ? "Single venue" : "Outdoor idea"}
          </Badge>
          <IconButton
            type="button"
            variant={saved ? "idea-saved" : "idea-save"}
            icon={saved ? "bookmark-check" : "heart"}
            disabled={busy}
            onClick={() => onToggleSaved()}
            label={
              saved ? `Unsave ${location.title}` : `Save ${location.title}`
            }
            title={saved ? "Saved" : "Save for later"}
          />
        </>
      }
    >
      <h3>{location.title}</h3>
      <p>{location.description}</p>
      <MetadataList>
        <MetadataItem icon="wallet">{location.cost} cost</MetadataItem>
        <MetadataItem icon="users">{location.bestFor[0]}</MetadataItem>
      </MetadataList>
      <TagList variant="idea">
        {location.bestFor.slice(0, 4).map((tag) => (
          <Badge variant="tag" key={tag}>
            {tag}
          </Badge>
        ))}
      </TagList>
      <Disclosure variant="idea" summary="Practical checks">
        <ul>
          {location.considerations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Disclosure>
      <Button
        type="button"
        variant="idea-use"
        fullWidth={false}
        onClick={() => onUse()}
      >
        Use this venue idea{" "}
        <Icon name="arrow-right" className="icon--size-15" />
      </Button>
    </Card>
  );
}
