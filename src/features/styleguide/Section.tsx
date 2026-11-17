import { type ReactNode } from "react";

export function Section({
  id,
  number,
  title,
  description,
  children,
}: {
  id: string;
  number: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section
      id={`sg-${id}`}
      className="sg-section"
      aria-labelledby={`sg-${id}-title`}
    >
      <div className="sg-section-heading">
        <span>{number}</span>
        <div>
          <h2 id={`sg-${id}-title`}>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
