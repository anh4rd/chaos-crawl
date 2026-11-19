import { useEffect, useRef, useState } from "react";
import { readHostIdentity } from "../../lib/hostAuth";
import { readHostFavourites } from "../../lib/hostSavedQueries";
import { removeHostFavourite } from "../../lib/hostSavedCommands";
import type { HostSavedItem } from "../../types/hostSaved";
import type { HostSavedFilter } from "./types";
export function useSavedItems() {
  const [items, setItems] = useState<HostSavedItem[]>([]);
  const [filter, setFilter] = useState<HostSavedFilter>("all");
  const [loading, setLoading] = useState(true);
  const [queryError, setQueryError] = useState("");
  const [actionError, setActionError] = useState("");
  const mounted = useRef(false);

  useEffect(() => {
    let active = true;
    mounted.current = true;
    async function load() {
      setLoading(true);
      setQueryError("");
      const { data: userData } = await readHostIdentity();
      if (!active) return;
      if (!userData.user) {
        setQueryError("Please log in again.");
        setLoading(false);
        return;
      }
      const { data, error: readError } = await readHostFavourites(
        userData.user.id,
      );
      if (!active) return;
      setLoading(false);
      if (readError) {
        setQueryError(
          "Couldn't load saved items. Check that the host planning migration has been run.",
        );
        return;
      }
      setItems(data ?? []);
    }
    void load();
    return () => {
      active = false;
      mounted.current = false;
    };
  }, []);

  async function remove(item: HostSavedItem) {
    if (!mounted.current) return;
    const { error: deleteError } = await removeHostFavourite({ id: item.id });
    if (!mounted.current) return;
    if (deleteError) {
      setActionError(deleteError.message);
      return;
    }
    setItems((current) => current.filter((entry) => entry.id !== item.id));
  }

  const visible = items.filter(
    (item) => filter === "all" || item.item_type === filter,
  );
  const error = actionError || queryError;
  return { items, filter, setFilter, loading, error, visible, remove };
}
