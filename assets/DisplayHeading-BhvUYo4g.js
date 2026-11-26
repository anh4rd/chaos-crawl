var e=`import type { ReactNode } from "react";

export default function DisplayHeading({
  children,
  as: Heading = "h2",
  hero = false,
  variant,
  className = "",
}: {
  children: ReactNode;
  as?: "h1" | "h2" | "h3";
  hero?: boolean;
  className?: string;
  variant?:
    | "access"
    | "console-brand"
    | "plain"
    | "plain-compact"
    | "plain-title"
    | "plain-stat"
    | "plain-body";
}) {
  return (
    <Heading
      className={\`display-heading\${hero ? " display-heading--hero" : ""}\${variant ? \` display-heading--\${variant}\` : ""}\${className ? \` \${className}\` : ""}\`}
    >
      {children}
    </Heading>
  );
}
`;export{e as default};