import type { ReactNode } from "react";

export default function DisplayHeading({
  children,
  as: Heading = "h2",
  hero = false,
  variant,
}: {
  children: ReactNode;
  as?: "h1" | "h2" | "h3";
  hero?: boolean;
  variant?: "access";
}) {
  return (
    <Heading
      className={`display-heading${hero ? " display-heading--hero" : ""}${variant ? ` display-heading--${variant}` : ""}`}
    >
      {children}
    </Heading>
  );
}
