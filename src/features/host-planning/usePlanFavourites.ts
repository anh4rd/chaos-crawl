import type { User } from "@supabase/supabase-js";
import { useState, useEffect, useRef, useCallback } from "react";
import { failedResult, runApi } from "../../lib/apiResult";
import { readHostIdentity } from "../../lib/hostAuth";
import {
  addPlanFavourite,
  removePlanFavourite,
  readPlanFavourites,
} from "../../lib/hostPlanApi";
import type { Favourite, Task } from "./types";
import { favouriteTaskId } from "./planImports";
export function usePlanFavourites({
  setError,
}: {
  setError: (message: string) => void;
}) {
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [favouritesAvailable, setFavouritesAvailable] = useState(false);
  const [favouritesLoading, setFavouritesLoading] = useState(false);
  const [favouritesError, setFavouritesError] = useState("");
  const collectionVersion = useRef(0);
  const available = useRef(false);
  const owner = useRef<string | null>(null);
  const pending = useRef(new Set<string>());
  const scope = useRef(0);
  useEffect(
    () => () => {
      scope.current += 1;
      collectionVersion.current += 1;
    },
    [],
  );
  const loadFavourites = useCallback(async (hostId: string) => {
    if (pending.current.size) {
      setFavouritesError(
        "Wait for your favourite change to finish, then retry loading favourites.",
      );
      return;
    }
    owner.current = hostId;
    available.current = false;
    const request = scope.current;
    const version = ++collectionVersion.current;
    setFavouritesAvailable(false);
    setFavouritesLoading(true);
    setFavouritesError("");
    const result = await readPlanFavourites(hostId).catch(failedResult);
    if (request !== scope.current || version !== collectionVersion.current)
      return;
    if (result.error)
      setFavouritesError(
        "Couldn't load your favourites. Retry before saving or removing a favourite.",
      );
    else {
      setFavourites(result.data ?? []);
      available.current = true;
      setFavouritesAvailable(true);
    }
    setFavouritesLoading(false);
  }, []);
  async function reloadFavourites() {
    if (pending.current.size) {
      setFavouritesError(
        "Wait for your favourite change to finish, then retry loading favourites.",
      );
      return;
    }
    const request = scope.current;
    const version = ++collectionVersion.current;
    available.current = false;
    setFavouritesAvailable(false);
    setFavouritesLoading(true);
    const { data, error } = await runApi<{ user: User | null }>(
      readHostIdentity,
    );
    if (request !== scope.current || version !== collectionVersion.current)
      return;
    if (error || !data?.user) {
      available.current = false;
      setFavouritesAvailable(false);
      setFavouritesError("Your host session has expired. Please log in again.");
      setFavouritesLoading(false);
      return;
    }
    await loadFavourites(data.user.id);
  }
  async function toggleFavourite(task: Task) {
    if (!available.current) {
      setError(
        "Your favourites are unavailable. Retry loading them before making changes.",
      );
      return;
    }
    const sourceId = favouriteTaskId(task.id);
    if (pending.current.has(sourceId)) return;
    pending.current.add(sourceId);
    const request = scope.current;
    const version = collectionVersion.current;
    try {
      const { data: auth } = await runApi<{ user: User | null }>(
        readHostIdentity,
      );
      if (request !== scope.current || version !== collectionVersion.current)
        return;
      if (!auth?.user || auth.user.id !== owner.current || !available.current) {
        setError("Please log in again.");
        return;
      }
      const userId = auth.user.id;
      const found = favourites.find(
        (f) =>
          f.item_type === "task" &&
          (f.item_id === task.id || f.item_id === sourceId),
      );
      if (found) {
        const { error } = await removePlanFavourite(found.id).catch(
          failedResult,
        );
        if (request !== scope.current) return;
        if (error) setError(error.message);
        else
          setFavourites((current) =>
            current.filter((item) => item.id !== found.id),
          );
      } else {
        const { data, error } = await addPlanFavourite(userId, {
          ...task,
          id: sourceId,
        }).catch(failedResult);
        if (request !== scope.current) return;
        if (error) setError(error.message);
        else if (data) setFavourites((current) => [...current, data]);
      }
    } finally {
      pending.current.delete(sourceId);
    }
  }

  return {
    favourites,
    loadFavourites,
    reloadFavourites,
    favouritesAvailable,
    favouritesLoading,
    favouritesError,
    toggleFavourite,
  };
}
