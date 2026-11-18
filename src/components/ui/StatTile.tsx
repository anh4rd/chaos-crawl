import type { ReactNode } from "react";
import IconBadge from "./IconBadge";
import type { IconName } from "./Icon";
export default function StatTile({
  icon,
  tone,
  value,
  label,
  variant = "default",
}: {
  icon?: IconName;
  variant?: "default" | "compact" | "review";
  tone?: "lime" | "violet" | "pink";
  value: ReactNode;
  label: string;
}) {
  if (variant === "review")
    return (
      <div className="stat-tile stat-tile--review">
        <span className="stat-tile__label">{label}</span>
        <strong className="stat-tile__value">{value}</strong>
      </div>
    );
  if (variant === "compact")
    return (
      <div className="stat-tile stat-tile--compact">
        <strong className="stat-tile__value">{value}</strong>
        <span className="stat-tile__label">{label}</span>
      </div>
    );
  return (
    <article className="stat-tile stat-tile--default">
      {icon && <IconBadge icon={icon} tone={tone} />}
      <div className="stat-tile__copy">
        <strong className="stat-tile__value">{value}</strong>
        <small className="stat-tile__label">{label}</small>
      </div>
    </article>
  );
}
