import type { ButtonHTMLAttributes } from "react";
import Button from "./Button";
import Icon, { type IconName } from "./Icon";
interface Props extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  icon: IconName;
  label: string;
  variant?:
    | "panel-close"
    | "slideshow-fullscreen"
    | "danger"
    | "entity-remove"
    | "control-replay"
    | "dialog-dismiss"
    | "idea-save"
    | "idea-saved"
    | "idea-close"
    | "search-clear";
  iconClassName?: string;
}
export default function IconButton({
  icon,
  label,
  variant,
  className = "",
  iconClassName = "icon--size-18",
  ...props
}: Props) {
  const buttonVariant =
    variant === "danger" || variant === "entity-remove"
      ? "comic-icon-danger"
      : (variant ?? "comic-icon");
  return (
    <Button
      {...props}
      fullWidth={false}
      variant={buttonVariant}
      className={`${variant === "entity-remove" ? "btn--entity-remove" : ""} ${className}`.trim()}
      aria-label={label}
    >
      <Icon name={icon} className={iconClassName} />
    </Button>
  );
}
