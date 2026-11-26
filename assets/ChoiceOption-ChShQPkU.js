var e=`import type { ButtonHTMLAttributes } from "react";
import Icon from "./Icon";
import Avatar from "./Avatar";

export default function ChoiceOption({
  variant,
  label,
  description,
  selected = false,
  className = "",
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  variant?: "ballot";
  label: string;
  description: string;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      {...props}
      className={\`choice-option\${variant ? \` choice-option--\${variant}\` : ""}\${selected ? " choice-option--selected" : ""} \${className}\`.trim()}
    >
      {variant === "ballot" ? (
        <>
          <div className="choice-option__label">{label}</div>
          {description && (
            <div className="choice-option__description">{description}</div>
          )}
        </>
      ) : (
        <>
          <Avatar variant="choice" name={label} />
          <span className="choice-option__copy">
            <strong>{label}</strong>
            <small>{description}</small>
          </span>
          {selected && <Icon name="check-circle2" className="icon--size-19" />}
        </>
      )}
    </button>
  );
}
`;export{e as default};