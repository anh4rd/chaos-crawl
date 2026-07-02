import type { Player } from "../types/player";

const STORAGE_KEY = "chaos-crawl-player";

export function savePlayer(player: Player) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
}

export function loadPlayer(): Player | null {
  const data = localStorage.getItem(STORAGE_KEY);

  if (!data) return null;

  return JSON.parse(data);
}

export function clearPlayer() {
  localStorage.removeItem(STORAGE_KEY);
}