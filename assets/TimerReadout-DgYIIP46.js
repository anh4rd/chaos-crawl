var e=`import type { ReactNode } from "react";

export default function TimerReadout({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="timer-readout">
      <span className="timer-readout__label">{label}</span>
      <strong className="timer-readout__value">{value}</strong>
    </div>
  );
}
`;export{e as default};