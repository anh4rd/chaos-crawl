import { useLayoutEffect, useRef, type FocusEvent } from "react";
import type { PlayerRowModel } from "./types";

export function useRosterFocus(players: PlayerRowModel[]) {
  const root = useRef<HTMLElement | null>(null);
  const newPlayer = useRef<HTMLInputElement>(null);
  const focused = useRef<{ id: string; element: HTMLElement } | null>(null);
  const previousIds = useRef(players.map((player) => player.id));

  useLayoutEffect(() => {
    const ids = players.map((player) => player.id);
    const previous = focused.current;
    if (previous && !previous.element.isConnected) {
      focused.current = null;
      if (
        !ids.includes(previous.id) &&
        document.activeElement === document.body
      ) {
        const index = previousIds.current.indexOf(previous.id);
        const nextId = ids[Math.min(Math.max(index, 0), ids.length - 1)];
        const row = [
          ...(root.current?.querySelectorAll<HTMLElement>(
            "[data-roster-player-id]",
          ) ?? []),
        ].find((element) => element.dataset.rosterPlayerId === nextId);
        const target =
          row?.querySelector<HTMLInputElement>("input:not(:disabled)") ??
          newPlayer.current;
        target?.focus();
      }
    }
    previousIds.current = ids;
  }, [players]);

  function onFocusCapture(event: FocusEvent<HTMLElement>) {
    root.current = event.currentTarget;
    const element = event.target;
    const id = element.closest<HTMLElement>("[data-roster-player-id]")?.dataset
      .rosterPlayerId;
    focused.current = id ? { id, element } : null;
  }
  function onBlurCapture(event: FocusEvent<HTMLElement>) {
    if (
      event.relatedTarget instanceof Node &&
      event.currentTarget.contains(event.relatedTarget)
    )
      return;
    if (event.target.isConnected) focused.current = null;
  }

  return { newPlayer, onFocusCapture, onBlurCapture };
}
