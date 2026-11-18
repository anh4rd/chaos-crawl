import Icon from "../ui/Icon";
import type { SessionGame } from "./types";

export function SessionGameTitlebar({
  tourTarget,
  name,
  code,
  photoUrl,
  copied = false,
  onCopy,
}: SessionGame) {
  return (
    <section
      className="session-titlebar"
      aria-label="Game details"
      data-tour={tourTarget}
    >
      <span className="session-titlebar__art">
        {photoUrl ? (
          <img src={photoUrl} alt={`${name} game art`} />
        ) : (
          <span aria-hidden="true">🎉</span>
        )}
      </span>
      <div className="session-titlebar__name">
        <strong>{name}</strong>
        <small>GAME</small>
      </div>
      <div className="session-titlebar__code">
        <small>GAME CODE</small>
        <strong>{code}</strong>
      </div>
      <button
        type="button"
        className="session-titlebar__copy"
        onClick={onCopy}
        aria-label="Copy game code"
        title="Copy game code"
      >
        <Icon
          name={copied ? "check" : "copy"}
          className="icon--size-19"
          aria-hidden="true"
        />
      </button>
    </section>
  );
}
