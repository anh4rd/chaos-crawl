import type { ReactNode } from "react";
export default function PageHeading({
  title,
  subtitle,
  action,
  variant,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  variant?: "results";
}) {
  if (!title && !subtitle && !action) return null;
  const Heading = variant === "results" ? "h2" : "h1";
  return (
    <div
      className={`page-heading${variant ? ` page-heading--${variant}` : ""}`}
    >
      <div>
        {title && <Heading>{title}</Heading>}
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
