import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
  variant?: "poster";
  accent?: boolean;
}

export default function Card({
  children,
  className = "",
  as: Container = "div",
  variant,
  accent = false,
}: CardProps) {
  return (
    <Container
      className={`card${variant ? ` card--${variant}` : ""}${accent ? " card--accent" : ""} ${className}`.trim()}
    >
      {children}
    </Container>
  );
}
