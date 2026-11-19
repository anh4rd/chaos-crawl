export default function SessionCandidate({
  name,
  detail,
  selected,
  busy = false,
  actionLabel = "Vote",
  onSelect,
}: {
  name: string;
  detail: string;
  selected: boolean;
  busy?: boolean;
  actionLabel?: string;
  onSelect?: () => void;
}) {
  const content = (
    <>
      <span className="session-candidate__avatar">
        {name.slice(0, 1).toUpperCase()}
      </span>
      <span className="session-candidate__copy">
        <strong>{name}</strong>
        <small>{detail}</small>
      </span>
      {onSelect && <span>{selected ? "Selected" : actionLabel}</span>}
    </>
  );
  return onSelect ? (
    <button
      type="button"
      className="session-candidate"
      aria-label={`${actionLabel} ${name}`}
      aria-pressed={selected}
      disabled={busy}
      onClick={onSelect}
    >
      {content}
    </button>
  ) : (
    <div className="session-candidate">{content}</div>
  );
}
