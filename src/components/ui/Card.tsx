import type { ReactNode } from "react";
import ContentPanel from "./ContentPanel";

type CardProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
  accent?: boolean;
} & (
  | { variant: "idea"; header: ReactNode }
  | { variant?: "poster"; header?: never }
);

export default function Card({
  children,
  header,
  className = "",
  as: Container = "div",
  variant,
  accent = false,
}: CardProps) {
  const classes =
    `card${variant ? ` card--${variant}` : ""}${accent ? " card--accent" : ""} ${className}`.trim();
  if (variant === "idea") {
    return (
      <ContentPanel as={Container} variant="entity" className={classes}>
        <div className="card__header">{header}</div>
        {children}
      </ContentPanel>
    );
  }
  return <Container className={classes}>{children}</Container>;
}
