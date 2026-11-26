var e=`import type { ReactNode } from "react";

export default function UpcomingChallenge({
  round,
  title,
  description,
  minutes,
  points,
  evidenceRequired,
  children,
}: {
  round: number | null;
  title: string;
  description: string | null;
  minutes: number;
  points: number;
  evidenceRequired: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="upcoming-challenge">
      <span>UP NEXT · ROUND {round}</span>
      <strong>{title}</strong>
      <p>{description}</p>
      <small>
        {minutes}
        {" min ·"} {points} pts ·{" "}
        {evidenceRequired ? "Photo evidence enabled" : "No photo evidence"}
      </small>
      {children}
    </div>
  );
}
`;export{e as default};