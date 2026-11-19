import HostWorkspace from "../host-workspace/HostWorkspace";
import SavedItemsView from "./SavedItemsView";
import { useSavedItems } from "./useSavedItems";
export default function SavedItemsWorkspace() {
  const saved = useSavedItems();
  return (
    <HostWorkspace
      title="Your saved stuff"
      subtitle="Keep challenges, location ideas and route templates close for next time."
      showCreate
    >
      <SavedItemsView
        itemsCount={saved.items.length}
        filter={saved.filter}
        onFilterChange={saved.setFilter}
        loading={saved.loading}
        error={saved.error}
        visible={saved.visible}
        onRemove={(item) => void saved.remove(item)}
      />
    </HostWorkspace>
  );
}
