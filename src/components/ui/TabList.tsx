import { handleTabListKeyDown } from "./tabListNavigation";
import type { ReactNode } from "react";

export default function TabList({
  label,
  variant,
  navigation = "arrows",
  children,
}: {
  label: string;
  variant?: "workspace" | "leaderboard";
  navigation?: "arrows" | "native";
  children: ReactNode;
}) {
  return (
    <div
      className={`tab-list${variant ? ` tab-list--${variant}` : ""}`}
      role="tablist"
      tabIndex={navigation === "native" ? undefined : -1}
      aria-label={label}
      aria-orientation={navigation === "native" ? undefined : "horizontal"}
      onKeyDown={navigation === "native" ? undefined : handleTabListKeyDown}
    >
      {children}
    </div>
  );
}
