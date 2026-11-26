var e=`import type { ReactNode } from "react";

export default function StepOutline({
  steps,
  note,
}: {
  steps: readonly { title: string; detail: string }[];
  note: ReactNode;
}) {
  return (
    <div className="step-outline">
      <ol className="step-outline__list">
        {steps.map((step, index) => (
          <li className="step-outline__step" key={step.title}>
            <span className="step-outline__number">{index + 1}</span>
            <div className="step-outline__copy">
              <strong className="step-outline__title">{step.title}</strong>
              <small className="step-outline__detail">{step.detail}</small>
            </div>
          </li>
        ))}
      </ol>
      <p className="step-outline__note">{note}</p>
    </div>
  );
}
`;export{e as default};