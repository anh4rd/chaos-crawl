const PLAYER_ID_KEY = "chaos-crawl-player-id";
export const PLAYER_SESSION_CHANGED_EVENT =
  "chaos-crawl-player-session-changed";

export type PlayerSessionRead =
  | { status: "ready"; playerId: string }
  | { status: "missing"; playerId: null }
  | { status: "unavailable"; playerId: null; error: Error };

export function readPlayerSession(): PlayerSessionRead {
  try {
    const playerId = window.localStorage.getItem(PLAYER_ID_KEY);
    return playerId
      ? { status: "ready", playerId }
      : { status: "missing", playerId: null };
  } catch {
    return {
      status: "unavailable",
      playerId: null,
      error: new Error(
        "Your saved player session cannot be read because browser storage is blocked or unavailable. Allow site storage in your browser settings, then try again.",
      ),
    };
  }
}

export function setPlayerId(playerId: string) {
  window.localStorage.setItem(PLAYER_ID_KEY, playerId);
  window.dispatchEvent(new Event(PLAYER_SESSION_CHANGED_EVENT));
}

export function clearPlayerId() {
  window.localStorage.removeItem(PLAYER_ID_KEY);
  window.dispatchEvent(new Event(PLAYER_SESSION_CHANGED_EVENT));
}
