import type { ButtonHTMLAttributes } from "react";
import Icon from "./Icon";
import Avatar from "./Avatar";

export default function ChoiceOption({
  label,
  description,
  selected = false,
  className = "",
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  label: string;
  description: string;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      {...props}
      className={`choice-option${selected ? " choice-option--selected" : ""} ${className}`.trim()}
    >
      <Avatar variant="choice" name={label} />
      <span className="choice-option__copy">
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      {selected && <Icon name="check-circle2" className="icon--size-19" />}
    </button>
  );
}
