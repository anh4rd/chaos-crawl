import type { Ref } from "react";
import SessionNavItem from "./SessionNavItem";
import type { SessionSection } from "./types";

type Navigation =
  | { hrefFor: (section: SessionSection) => string; onSelect?: never }
  | { onSelect: (section: SessionSection) => void; hrefFor?: never };
export default function SessionNavigation({
  active,
  elementRef,
  showFinal = false,
  showHost = false,
  challengeCount,
  countLabel,
  tourTarget,
  ...navigation
}: Navigation & {
  active: SessionSection;
  elementRef?: Ref<HTMLElement>;
  showFinal?: boolean;
  showHost?: boolean;
  challengeCount?: number;
  countLabel?: string;
  tourTarget?: string;
}) {
  const target = (section: SessionSection) =>
    navigation.hrefFor
      ? { to: navigation.hrefFor(section) }
      : { onClick: () => navigation.onSelect?.(section) };
  return (
    <nav
      ref={elementRef}
      className="session-navigation"
      aria-label="Game pages"
      data-tour={tourTarget}
    >
      <SessionNavItem
        label="Game"
        icon="gamepad2"
        active={active === "game"}
        {...target("game")}
      />
      <SessionNavItem
        label="Scores"
        icon="trophy"
        active={active === "leaderboard"}
        {...target("leaderboard")}
      />
      <SessionNavItem
        label="Challenges"
        icon="clipboard-list"
        active={active === "side-challenges"}
        count={challengeCount}
        countLabel={countLabel}
        {...target("side-challenges")}
      />
      {showFinal && (
        <SessionNavItem
          label="Final"
          icon="heart"
          active={active === "final"}
          {...target("final")}
        />
      )}
      {showHost && (
        <SessionNavItem
          label="Host"
          icon="shield"
          active={active === "host-controls"}
          {...target("host-controls")}
        />
      )}
    </nav>
  );
}
