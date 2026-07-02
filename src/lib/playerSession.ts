const STORAGE_KEY = "chaos-crawl-player-id";

export function savePlayerId(id: string) {
  localStorage.setItem(STORAGE_KEY, id);
}

export function getPlayerId() {
  return localStorage.getItem(STORAGE_KEY);
}

export function clearPlayerId() {
  localStorage.removeItem(STORAGE_KEY);
}