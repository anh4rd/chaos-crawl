import type { ReactNode } from "react";
import ContextCard from "./ContextCard";
import Ribbon from "./Ribbon";
export default function ChecklistProgress({
  checks,
  summary,
  children,
}: {
  checks?: Array<{ label: string; done: boolean; marker: ReactNode }>;
  summary?: ReactNode;
  children: ReactNode;
}) {
  const done = checks?.filter((item) => item.done).length ?? 0;
  const progress = checks?.length ? (done / checks.length) * 100 : 0;
  return (
    <ContextCard className="setup-progress">
      <Ribbon>SETUP PROGRESS</Ribbon>
      {checks && (
        <>
          <strong className="setup-progress__count">{summary}</strong>
          <div className="setup-progress__track">
            {/* Width represents completion data rather than a design value. */}
            <span style={{ width: `${progress}%` }} />
          </div>
          <ul>
            {checks.map((item) => (
              <li
                key={item.label}
                className={`setup-progress__item${item.done ? " setup-progress__item--complete" : ""}`}
              >
                <span className="setup-progress__check">{item.marker}</span>
                {item.label}
              </li>
            ))}
          </ul>
        </>
      )}
      {children}
    </ContextCard>
  );
}
