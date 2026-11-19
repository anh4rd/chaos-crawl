import type { ReactNode } from "react";
export default function HistoryRow({
  title,
  detail,
  note,
  status,
}: {
  title: string;
  detail: ReactNode;
  note?: string | null;
  status: ReactNode;
}) {
  return (
    <div className="history-row">
      <div>
        <strong>{title}</strong>
        <small>{detail}</small>
        {note && <small>{note}</small>}
      </div>
      {status}
    </div>
  );
}
