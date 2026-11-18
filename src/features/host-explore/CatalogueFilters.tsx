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
}: CatalogueFiltersModel) {
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
