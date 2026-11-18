import Icon from "../../components/ui/Icon";
import type { CatalogueFiltersModel } from "./viewTypes";

export default function CatalogueFilters({
  tab,
  counts,
  search,
  category,
  categories,
  onTabChange,
  onSearchChange,
  onCategoryChange,
}: CatalogueFiltersModel) {
  return (
    <>
      <div className="host-explore-toolbar">
        <div
          className="host-explore-tabs"
          role="tablist"
          aria-label="Explore catalogue"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "tasks"}
            className={tab === "tasks" ? "is-active" : ""}
            onClick={() => {
              onTabChange("tasks");
            }}
          >
            <Icon name="sparkles" className="icon--size-16" /> Tasks{" "}
            <span>{counts.tasks}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "locations"}
            className={tab === "locations" ? "is-active" : ""}
            onClick={() => {
              onTabChange("locations");
            }}
          >
            <Icon name="map-pin" className="icon--size-16" /> Locations{" "}
            <span>{counts.locations}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "routes"}
            className={tab === "routes" ? "is-active" : ""}
            onClick={() => {
              onTabChange("routes");
            }}
          >
            <Icon name="compass" className="icon--size-16" /> Routes{" "}
            <span>{counts.routes}</span>
          </button>
        </div>
        <label className="host-explore-search">
          <Icon name="search" className="icon--size-17" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={`Search ${tab}…`}
            aria-label={`Search ${tab}`}
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
            >
              <Icon name="x" className="icon--size-15" />
            </button>
          )}
        </label>
      </div>

      <div className="host-explore-categories" aria-label="Filter catalogue">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            className={category === item ? "is-active" : ""}
            aria-pressed={category === item}
            onClick={() => onCategoryChange(item)}
          >
            {item === "all" ? "Everything" : item}
          </button>
        ))}
      </div>
    </>
  );
}
