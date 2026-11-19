import { useCallback, useEffect, useRef, useState } from "react";
import type { HostFavourite } from "../../types/hostExplore";
import type {
  CatalogTask,
  LocationIdea,
  RouteIdea,
  ExploreActionFeedback,
} from "./types";
import { apiError } from "../../lib/apiResult";
import { readHostIdentity } from "../../lib/hostAuth";
import { readExploreFavourites } from "../../lib/hostExploreQueries";
import { saveExploreFavourite } from "../../lib/hostExploreCommands";
import { removeHostFavourite } from "../../lib/hostSavedCommands";
import { favouriteData } from "./favouriteData";

export function useExploreFavourites({
  onQueryError,
  onActionStart,
  onActionError,
}: ExploreActionFeedback & { onQueryError: (message: string) => void }) {
  const [favourites, setFavourites] = useState<HostFavourite[]>([]);
  const [loadingFavourites, setLoadingFavourites] = useState(true);
  const [busyFavourites, setBusyFavourites] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const pending = useRef(new Set<string>());
  const currentFavourites = useRef<HostFavourite[]>([]);
  const replaceFavourites = useCallback((items: HostFavourite[]) => {
    currentFavourites.current = items;
    setFavourites(items);
  }, []);
  const mounted = useRef(false);
  const lifetime = useRef(0);
  useEffect(() => {
    const operations = pending.current;
    mounted.current = true;
    lifetime.current += 1;
    return () => {
      mounted.current = false;
      operations.clear();
    };
  }, []);
  const favouriteRead = useRef(0);
  const changedFavourites = useRef(new Set<string>());
  const loadFavourites = useCallback(async () => {
    if (!mounted.current) return;
    const request = ++favouriteRead.current;
    const generation = lifetime.current;
    const current = () =>
      mounted.current &&
      lifetime.current === generation &&
      favouriteRead.current === request;
    changedFavourites.current.clear();
    setLoadingFavourites(true);
    try {
      const { data: userData, error: userError } = await readHostIdentity();
      if (!current()) return;
      if (userError || !userData.user) {
        onQueryError("Your session has expired. Please log in again.");
        return;
      }
      const { data, error: queryError } = await readExploreFavourites(
        userData.user.id,
      );
      if (!current()) return;
      if (queryError) {
        onQueryError(
          "Couldn't load your saved items. Check that the host planning migration has been run.",
        );
        return;
      }
      const incoming = (data ?? []).filter(
        (item) =>
          !changedFavourites.current.has(`${item.item_type}:${item.item_id}`),
      );
      const changed = currentFavourites.current.filter((item) =>
        changedFavourites.current.has(`${item.item_type}:${item.item_id}`),
      );
      replaceFavourites([...incoming, ...changed]);
    } catch (error) {
      if (current()) onQueryError(apiError(error).message);
    } finally {
      if (current()) setLoadingFavourites(false);
    }
  }, [onQueryError, replaceFavourites]);

  useEffect(() => {
    void loadFavourites();
  }, [loadFavourites]);

  function isSaved(type: HostFavourite["item_type"], id: string) {
    return favourites.some(
      (item) => item.item_type === type && item.item_id === id,
    );
  }
  async function toggleFavourite(
    type: HostFavourite["item_type"],
    id: string,
    data: CatalogTask | LocationIdea | RouteIdea,
  ) {
    const generation = lifetime.current;
    const current = () => mounted.current && lifetime.current === generation;
    const key = `${type}:${id}`;
    if (!current() || pending.current.has(key)) return;
    pending.current.add(key);
    setBusyFavourites(new Set(pending.current));
    onActionStart();
    try {
      const existing = currentFavourites.current.find(
        (item) => item.item_type === type && item.item_id === id,
      );
      if (existing) {
        const { error: deleteError } = await removeHostFavourite({
          id: existing.id,
        });
        if (!current()) return;
        if (deleteError) {
          onActionError(deleteError.message);
          return;
        }
        changedFavourites.current.add(key);
        replaceFavourites(
          currentFavourites.current.filter((item) => item.id !== existing.id),
        );
        return;
      }

      const { data: userData, error: userError } = await readHostIdentity();
      if (!current()) return;
      if (userError || !userData.user) {
        onActionError("Your host session has expired. Please log in again.");
        return;
      }

      const { data: saved, error: saveError } = await saveExploreFavourite({
        hostId: userData.user.id,
        itemType: type,
        itemId: id,
        itemData: favouriteData(data),
      });
      if (!current()) return;
      if (saveError) {
        onActionError(
          type === "route"
            ? "Route favourites need the latest host catalogue migration. Run 20261023_host_catalog_routes.sql in Supabase, then try again."
            : saveError.message,
        );
        return;
      }
      if (saved) {
        changedFavourites.current.add(key);
        replaceFavourites([...currentFavourites.current, saved]);
      }
    } catch (error) {
      if (current()) onActionError(apiError(error).message);
    } finally {
      if (current()) {
        pending.current.delete(key);
        setBusyFavourites(new Set(pending.current));
      }
    }
  }

  function isFavouriteBusy(type: HostFavourite["item_type"], id: string) {
    return busyFavourites.has(`${type}:${id}`);
  }

  return { loadingFavourites, isFavouriteBusy, isSaved, toggleFavourite };
}
