import { useId } from "react";
import { Link } from "react-router-dom";
import Icon, { type IconName } from "../ui/Icon";

type Target =
  { to: string; onClick?: never } | { onClick: () => void; to?: never };
export default function SessionNavItem({
  label,
  icon,
  active,
  count,
  countLabel,
  ...target
}: Target & {
  label: string;
  icon: IconName;
  active: boolean;
  count?: number;
  countLabel?: string;
}) {
  const countId = useId();
  const className = `session-navigation__item${active ? " session-navigation__item--active" : ""}`;
  const content = (
    <>
      <Icon name={icon} className="icon--size-18" aria-hidden="true" />
      <span>{label}</span>
      {Boolean(count) && (
        <span
          id={countId}
          className="session-navigation__count"
          aria-label={countLabel}
        >
          {count}
        </span>
      )}
    </>
  );
  if (target.to !== undefined)
    return (
      <Link
        to={target.to}
        className={className}
        aria-label={label}
        aria-describedby={count ? countId : undefined}
        aria-current={active ? "page" : undefined}
      >
        {content}
      </Link>
    );
  return (
    <button
      type="button"
      onClick={target.onClick}
      className={className}
      aria-label={label}
      aria-describedby={count ? countId : undefined}
      aria-current={active ? "page" : undefined}
    >
      {content}
    </button>
  );
}
