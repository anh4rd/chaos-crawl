import type { ReactNode } from "react";

export default function TabList({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      className="tab-list"
      role="tablist"
      tabIndex={-1}
      aria-label={label}
      aria-orientation="horizontal"
      onKeyDown={(event) => {
        const current = event.target;
        if (
          !(current instanceof HTMLButtonElement) ||
          current.getAttribute("role") !== "tab"
        )
          return;
        const tabs = [
          ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
            'button[role="tab"]:not(:disabled):not([aria-disabled="true"])',
          ),
        ].filter(
          (tab) => tab.closest('[role="tablist"]') === event.currentTarget,
        );
        const index = tabs.indexOf(current);
        if (index < 0) return;
        let next = index;
        switch (event.key) {
          case "ArrowLeft":
            next = (index - 1 + tabs.length) % tabs.length;
            break;
          case "ArrowRight":
            next = (index + 1) % tabs.length;
            break;
          case "Home":
            next = 0;
            break;
          case "End":
            next = tabs.length - 1;
            break;
          default:
            return;
        }
        event.preventDefault();
        tabs[next]?.focus();
        tabs[next]?.click();
      }}
    >
      {children}
    </div>
  );
}
