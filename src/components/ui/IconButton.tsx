import type { ButtonHTMLAttributes } from "react";
import Button from "./Button";
import Icon, { type IconName } from "./Icon";
interface Props extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  icon: IconName;
  label: string;
  variant?: "danger" | "control-replay" | "dialog-dismiss";
  iconClassName?: string;
}
export default function IconButton({
  icon,
  label,
  variant,
  iconClassName = "icon--size-18",
  ...props
}: Props) {
  const buttonVariant =
    variant === "danger" ? "comic-icon-danger" : (variant ?? "comic-icon");
  return (
    <Button
      {...props}
      fullWidth={false}
      variant={buttonVariant}
      aria-label={label}
    >
      <Icon name={icon} className={iconClassName} />
    </Button>
  );
}
