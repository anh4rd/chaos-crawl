import { useCallback, useEffect, useRef, useState } from "react";
import type { HostFavourite } from "../../types/hostExplore";
import type {
  CatalogTask,
  LocationIdea,
  RouteIdea,
  ExploreActionFeedback,
} from "./types";
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
  const [busyFavourite, setBusyFavourite] = useState<string | null>(null);
  const mounted = useRef(false);
  const lifetime = useRef(0);
  useEffect(() => {
    mounted.current = true;
    lifetime.current += 1;
    return () => {
      mounted.current = false;
    };
  }, []);
  const favouriteRead = useRef(0);
  const loadFavourites = useCallback(async () => {
    if (!mounted.current) return;
    const request = ++favouriteRead.current;
    const generation = lifetime.current;
    const current = () =>
      mounted.current &&
      lifetime.current === generation &&
      favouriteRead.current === request;
    setLoadingFavourites(true);
    const { data: userData, error: userError } = await readHostIdentity();
    if (!current()) return;
    if (userError || !userData.user) {
      onQueryError("Your session has expired. Please log in again.");
      setLoadingFavourites(false);
      return;
    }
    const { data, error: queryError } = await readExploreFavourites(
      userData.user.id,
    );
    if (!current()) return;
    setLoadingFavourites(false);
    if (queryError) {
      onQueryError(
        "Couldn't load your saved items. Check that the host planning migration has been run.",
      );
      return;
    }
    setFavourites(data ?? []);
  }, [onQueryError]);

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
    if (!current()) return;
    const key = `${type}:${id}`;
    setBusyFavourite(key);
    onActionStart();
    const existing = favourites.find(
      (item) => item.item_type === type && item.item_id === id,
    );
    if (existing) {
      const { error: deleteError } = await removeHostFavourite({
        id: existing.id,
      });
      if (!current()) return;
      setBusyFavourite(null);
      if (deleteError) {
        onActionError(deleteError.message);
        return;
      }
      setFavourites((current) =>
        current.filter((item) => item.id !== existing.id),
      );
      return;
    }

    const { data: userData, error: userError } = await readHostIdentity();
    if (!current()) return;
    if (userError || !userData.user) {
      setBusyFavourite(null);
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
    setBusyFavourite(null);
    if (saveError) {
      onActionError(
        type === "route"
          ? "Route favourites need the latest host catalogue migration. Run 20261023_host_catalog_routes.sql in Supabase, then try again."
          : saveError.message,
      );
      return;
    }
    if (saved) setFavourites((current) => [...current, saved]);
  }

  return { loadingFavourites, busyFavourite, isSaved, toggleFavourite };
}
