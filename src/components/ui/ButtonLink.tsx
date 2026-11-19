import type { AnchorHTMLAttributes } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { buttonClasses, type ButtonVariant } from "./buttonClasses";
type Props = { variant?: ButtonVariant; fullWidth?: boolean } & (
  | (LinkProps & { href?: never })
  | (AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; to?: never })
);
export default function ButtonLink(props: Props) {
  if (props.href !== undefined) {
    const { variant, fullWidth = true, className = "", ...attributes } = props;
    return (
      <a
        {...attributes}
        className={buttonClasses({ variant, fullWidth, className })}
      >
        {attributes.children}
      </a>
    );
  }
  const { variant, fullWidth = true, className = "", ...attributes } = props;
  return (
    <Link
      {...attributes}
      className={buttonClasses({ variant, fullWidth, className })}
    />
  );
}
