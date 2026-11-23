import type { RankedParticipant } from "./types";

export default function SessionPodium({
  entries,
  label,
}: {
  entries: RankedParticipant[];
  label: string;
}) {
  if (entries.length === 0) return null;
  return (
    <ol className="session-podium" aria-label={label}>
      {entries.slice(0, 3).map((entry, index) => (
        <li
          key={entry.id}
          className={`session-podium__place session-podium__place--${index + 1}`}
        >
          <div className="session-podium__portrait">
            {index === 0 && (
              <img
                className="session-podium__crown"
                src={`${import.meta.env.BASE_URL}openmoji/1F451.svg`}
                alt=""
              />
            )}
            <span className="session-podium__avatar" aria-hidden="true">
              {entry.avatarUrl ? (
                <img src={entry.avatarUrl} alt="" />
              ) : (
                entry.name.slice(0, 1).toUpperCase()
              )}
            </span>
            <span className="session-podium__rank">{index + 1}</span>
          </div>
          <strong>{entry.name}</strong>
          <span>{entry.score} pts</span>
        </li>
      ))}
    </ol>
  );
}
