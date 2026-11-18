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
      {error && <div className="host-alert host-alert--error">{error}</div>}
      <div className="host-tabs" role="group" aria-label="Saved items filter">
        <button
          type="button"
          className={filter === "all" ? "is-active" : ""}
          aria-pressed={filter === "all"}
          onClick={() => onFilterChange("all")}
        >
          Everything <span className="host-tab-count">{itemsCount}</span>
        </button>
        <button
          type="button"
          className={filter === "task" ? "is-active" : ""}
          aria-pressed={filter === "task"}
          onClick={() => onFilterChange("task")}
        >
          <Icon name="clipboard-list" className="icon--size-15" /> Tasks
        </button>
        <button
          type="button"
          className={filter === "venue" ? "is-active" : ""}
          aria-pressed={filter === "venue"}
          onClick={() => onFilterChange("venue")}
        >
          <Icon name="map-pin" className="icon--size-15" /> Locations
        </button>
        <button
          type="button"
          className={filter === "route" ? "is-active" : ""}
          aria-pressed={filter === "route"}
          onClick={() => onFilterChange("route")}
        >
          <Icon name="compass" className="icon--size-15" /> Routes
        </button>
      </div>
      {loading ? (
        <div className="host-empty-state">Loading saved items…</div>
      ) : visible.length ? (
        <div className="host-saved-grid">
          {visible.map((item) => (
            <SavedItemCard
              key={item.id}
              item={item}
              onRemove={() => onRemove(item)}
            />
          ))}
        </div>
      ) : (
        <div className="host-empty-state">
          <Icon name="heart" className="icon--size-24" />
          <h3>Nothing saved yet</h3>
          <p>
            Save a challenge, venue idea or route template as you browse the
            library.
          </p>
        </div>
      )}
    </>
  );
}
