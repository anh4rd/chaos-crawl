import type { ReactNode } from "react";

export default function InstructionStep({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="instruction-step">
      <b className="instruction-step__number">{number}</b>
      <strong className="instruction-step__title">{title}</strong>
      <p className="instruction-step__copy">{children}</p>
    </article>
  );
}
