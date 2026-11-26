var e=`import Badge from "../../components/ui/Badge";
import ContentPanel from "../../components/ui/ContentPanel";
import IconBadge from "../../components/ui/IconBadge";
import Overline from "../../components/ui/Overline";
import Icon from "../../components/ui/Icon";
import IconButton from "../../components/ui/IconButton";
import type { HostSavedItem } from "../../types/hostSaved";
export default function SavedItemCard({
  item,
  onRemove,
}: {
  item: HostSavedItem;
  onRemove: () => void;
}) {
  const title = item.item_data.title ?? item.item_data.name ?? "Saved idea";
  const icon =
    item.item_type === "task"
      ? "clipboard-list"
      : item.item_type === "route"
        ? "compass"
        : "map-pin";
  const label =
    item.item_type === "task"
      ? "CHALLENGE"
      : item.item_type === "route"
        ? "ROUTE TEMPLATE"
        : "LOCATION IDEA";
  const stops = Array.isArray(item.item_data.stops)
    ? item.item_data.stops.join(" → ")
    : null;
  return (
    <ContentPanel as="article" variant="entity" className="saved-item-card">
      <IconBadge as="div" variant="entity">
        <Icon name={icon} className="icon--size-21" />
      </IconBadge>
      <div className="saved-item-card__copy">
        <Overline variant="workspace">{label}</Overline>
        <h3>{title}</h3>
        {item.item_data.description && <p>{item.item_data.description}</p>}
        {stops !== null && <p>{stops}</p>}
        {typeof item.item_data.points === "number" && (
          <Badge variant="entity">★ {item.item_data.points} points</Badge>
        )}
      </div>
      <IconButton
        type="button"
        onClick={onRemove}
        icon="trash2"
        label={\`Remove \${title} from saved items\`}
        iconClassName="icon--size-17"
        variant="entity-remove"
      />
    </ContentPanel>
  );
}
`;export{e as default};