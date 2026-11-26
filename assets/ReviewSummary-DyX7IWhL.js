var e=`import type { ReactNode } from "react";

export default function ReviewSummary({
  title,
  detail,
  description,
}: {
  title: string;
  detail: ReactNode;
  description: string;
}) {
  return (
    <div className="review-summary">
      <strong>{title}</strong>
      <span>{detail}</span>
      <p>{description}</p>
    </div>
  );
}
`;export{e as default};