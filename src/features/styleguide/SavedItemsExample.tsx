import { useState } from "react";
import SavedItemsView from "../host-saved/SavedItemsView";
import type { HostSavedFilter } from "../host-saved/types";
import type { HostSavedItem } from "../../types/hostSaved";
import HostPatternPreview from "./HostPatternPreview";
import { Example } from "./Example";

const samples: HostSavedItem[] = [
  {
    id: "sample-task",
    item_type: "task",
    item_id: "task",
    item_data: {
      title: "Sample task",
      description: "This collection uses local state.",
      points: 15,
    },
  },
  {
    id: "sample-venue",
    item_type: "venue",
    item_id: "venue",
    item_data: { name: "Sample venue" },
  },
  {
    id: "sample-route",
    item_type: "route",
    item_id: "route",
    item_data: { title: "Sample route", stops: ["One", "Two"] },
  },
];
export default function SavedItemsExample() {
  const [items, setItems] = useState(samples);
  const [filter, setFilter] = useState<HostSavedFilter>("all");
  const [loading, setLoading] = useState(false);
  const visible = items.filter(
    (item) => filter === "all" || item.item_type === filter,
  );
  return (
    <Example
      title="Local saved items"
      source="src/features/host-saved/SavedItemsView.tsx + SavedItemCard.tsx"
      code={"<SavedItemsView {...controlledCollectionAndCallbacks} />"}
    >
      <label>
        <input
          type="checkbox"
          checked={loading}
          onChange={(event) => setLoading(event.target.checked)}
        />{" "}
        Simulate saved-items loading
      </label>
      <HostPatternPreview>
        <SavedItemsView
          itemsCount={items.length}
          visible={visible}
          filter={filter}
          onFilterChange={setFilter}
          loading={loading}
          error=""
          onRemove={(item) =>
            setItems((current) =>
              current.filter((entry) => entry.id !== item.id),
            )
          }
        />
      </HostPatternPreview>
    </Example>
  );
}
