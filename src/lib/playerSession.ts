const PLAYER_ID_KEY =
  "chaos-crawl-player-id";

export function getPlayerId() {
  return localStorage.getItem(
    PLAYER_ID_KEY
  );
}

export function setPlayerId(
  playerId: string
) {
  localStorage.setItem(
    PLAYER_ID_KEY,
    playerId
  );
}

export function clearPlayerId() {
  localStorage.removeItem(
    PLAYER_ID_KEY
  );
}