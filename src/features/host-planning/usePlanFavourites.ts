import { useState, useEffect, useRef } from "react";
import { readHostIdentity } from "../../lib/hostAuth";
import { addPlanFavourite, removePlanFavourite } from "../../lib/hostPlanApi";
import type { Favourite, Task } from "./types";
export function usePlanFavourites({
  setError,
}: {
  setError: (message: string) => void;
}) {
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const pending = useRef(new Set<string>());
  const scope = useRef(0);
  useEffect(
    () => () => {
      scope.current += 1;
    },
    [],
  );
  async function toggleFavourite(task: Task) {
    if (pending.current.has(task.id)) return;
    pending.current.add(task.id);
    const request = scope.current;
    try {
      const { data: auth } = await readHostIdentity();
      if (request !== scope.current) return;
      if (!auth.user) {
        setError("Please log in again.");
        return;
      }
      const found = favourites.find(
        (f) => f.item_type === "task" && f.item_id === task.id,
      );
      if (found) {
        const { error } = await removePlanFavourite(found.id);
        if (request !== scope.current) return;
        if (error) setError(error.message);
        else
          setFavourites((current) =>
            current.filter((item) => item.id !== found.id),
          );
      } else {
        const { data, error } = await addPlanFavourite(auth.user.id, task);
        if (request !== scope.current) return;
        if (error) setError(error.message);
        else if (data) setFavourites((current) => [...current, data]);
      }
    } finally {
      pending.current.delete(task.id);
    }
  }

  return { favourites, setFavourites, toggleFavourite };
}
