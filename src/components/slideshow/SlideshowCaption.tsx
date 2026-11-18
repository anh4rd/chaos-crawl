import type { ReactNode } from "react";

export default function SlideshowCaption({
  kicker,
  title,
}: {
  kicker: ReactNode;
  title: string;
}) {
  return (
    <div className="cc-final-tv-caption">
      <span className="cc-final-tv-kicker">{kicker}</span>
      <h1>{title}</h1>
    </div>
  );
}
