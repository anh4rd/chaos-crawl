import type { ReactNode } from "react";

export default function DisplayHeading({
  children,
  as: Heading = "h2",
  hero = false,
}: {
  children: ReactNode;
  as?: "h1" | "h2" | "h3";
  hero?: boolean;
}) {
  return (
    <Heading
      className={`display-heading${hero ? " display-heading--hero" : ""}`}
    >
      {children}
    </Heading>
  );
}
