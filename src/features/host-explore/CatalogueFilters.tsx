import TabList from "../../components/ui/TabList";
import SearchField from "../../components/ui/SearchField";
import FilterGroup from "../../components/ui/FilterGroup";
import CountBadge from "../../components/ui/CountBadge";
import Button from "../../components/ui/Button";
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
  idPrefix,
}: CatalogueFiltersModel & { idPrefix: string }) {
  return (
    <>
      <div className="catalogue-filters">
        <TabList label="Explore catalogue">
          <Button
            variant="collection-tab"
            fullWidth={false}
            type="button"
            role="tab"
            aria-selected={tab === "tasks"}
            id={`${idPrefix}-tasks-tab`}
            aria-controls={`${idPrefix}-tasks-panel`}
            tabIndex={tab === "tasks" ? 0 : -1}
            onClick={() => {
              onTabChange("tasks");
            }}
          >
            <Icon name="sparkles" className="icon--size-16" /> Tasks{" "}
            <CountBadge variant="tab">{counts.tasks}</CountBadge>
          </Button>
          <Button
            variant="collection-tab"
            fullWidth={false}
            type="button"
            role="tab"
            aria-selected={tab === "locations"}
            id={`${idPrefix}-locations-tab`}
            aria-controls={`${idPrefix}-locations-panel`}
            tabIndex={tab === "locations" ? 0 : -1}
            onClick={() => {
              onTabChange("locations");
            }}
          >
            <Icon name="map-pin" className="icon--size-16" /> Locations{" "}
            <CountBadge variant="tab">{counts.locations}</CountBadge>
          </Button>
          <Button
            variant="collection-tab"
            fullWidth={false}
            type="button"
            role="tab"
            aria-selected={tab === "routes"}
            id={`${idPrefix}-routes-tab`}
            aria-controls={`${idPrefix}-routes-panel`}
            tabIndex={tab === "routes" ? 0 : -1}
            onClick={() => {
              onTabChange("routes");
            }}
          >
            <Icon name="compass" className="icon--size-16" /> Routes{" "}
            <CountBadge variant="tab">{counts.routes}</CountBadge>
          </Button>
        </TabList>
        <SearchField
          value={search}
          label={`Search ${tab}`}
          placeholder={`Search ${tab}…`}
          onChange={onSearchChange}
        />
      </div>

      <FilterGroup variant="categories" aria-label="Filter catalogue">
        {categories.map((item) => (
          <Button
            variant="category"
            fullWidth={false}
            key={item}
            type="button"
            aria-pressed={category === item}
            onClick={() => onCategoryChange(item)}
          >
            {item === "all" ? "Everything" : item}
          </Button>
        ))}
      </FilterGroup>
    </>
  );
}
