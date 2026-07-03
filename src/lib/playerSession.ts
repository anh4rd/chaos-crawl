const PLAYER_ID_KEY = "chaos-crawl-player-id";

export function savePlayerId(playerId: string) {
  localStorage.setItem(PLAYER_ID_KEY, playerId);
}

export function getPlayerId() {
  return localStorage.getItem(PLAYER_ID_KEY);
}

export function clearPlayerId() {
  localStorage.removeItem(PLAYER_ID_KEY);
}