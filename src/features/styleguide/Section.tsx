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
      className="component-section"
      aria-labelledby={`sg-${id}-title`}
    >
      <div className="component-section__heading">
        <span className="component-section__number">{number}</span>
        <div>
          <h2 className="component-section__title" id={`sg-${id}-title`}>
            {title}
          </h2>
          <p className="component-section__description">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
