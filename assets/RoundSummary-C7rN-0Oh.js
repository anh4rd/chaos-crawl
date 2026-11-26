var e=`import type { ReactNode } from "react";

export default function RoundSummary({
  title,
  detail,
  marker,
  status,
}: {
  title: string;
  detail: ReactNode;
  marker: ReactNode;
  status: ReactNode;
}) {
  return (
    <div className="round-summary">
      {marker}
      <div>
        <h3>{title}</h3>
        <p>{detail}</p>
      </div>
      {status}
    </div>
  );
}
`;export{e as default};