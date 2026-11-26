var e=`import Button from "../../components/ui/Button";
import ContentPanel from "../../components/ui/ContentPanel";
import CountBadge from "../../components/ui/CountBadge";
import EmptyState from "../../components/ui/EmptyState";
import FilterGroup from "../../components/ui/FilterGroup";
import PanelGrid from "../../components/ui/PanelGrid";
import Icon from "../../components/ui/Icon";
import SavedItemCard from "./SavedItemCard";
import type { SavedItemsModel } from "./types";
export default function SavedItemsView({
  itemsCount,
  visible,
  filter,
  onFilterChange,
  loading,
  error,
  onRemove,
}: SavedItemsModel) {
  return (
    <>
      {error && (
        <ContentPanel as="div" variant="workspace-error">
          {error}
        </ContentPanel>
      )}
      <FilterGroup role="group" aria-label="Saved items filter">
        <Button
          variant="filter"
          fullWidth={false}
          type="button"
          aria-pressed={filter === "all"}
          onClick={() => onFilterChange("all")}
        >
          Everything <CountBadge variant="filter">{itemsCount}</CountBadge>
        </Button>
        <Button
          variant="filter"
          fullWidth={false}
          type="button"
          aria-pressed={filter === "task"}
          onClick={() => onFilterChange("task")}
        >
          <Icon name="clipboard-list" className="icon--size-15" /> Tasks
        </Button>
        <Button
          variant="filter"
          fullWidth={false}
          type="button"
          aria-pressed={filter === "venue"}
          onClick={() => onFilterChange("venue")}
        >
          <Icon name="map-pin" className="icon--size-15" /> Locations
        </Button>
        <Button
          variant="filter"
          fullWidth={false}
          type="button"
          aria-pressed={filter === "route"}
          onClick={() => onFilterChange("route")}
        >
          <Icon name="compass" className="icon--size-15" /> Routes
        </Button>
      </FilterGroup>
      {loading ? (
        <EmptyState variant="workspace">Loading saved items…</EmptyState>
      ) : visible.length ? (
        <PanelGrid variant="collection">
          {visible.map((item) => (
            <SavedItemCard
              key={item.id}
              item={item}
              onRemove={() => onRemove(item)}
            />
          ))}
        </PanelGrid>
      ) : (
        <EmptyState variant="workspace">
          <Icon name="heart" className="icon--size-24" />
          <h3>Nothing saved yet</h3>
          <p>
            Save a challenge, venue idea or route template as you browse the
            library.
          </p>
        </EmptyState>
      )}
    </>
  );
}
`;export{e as default};