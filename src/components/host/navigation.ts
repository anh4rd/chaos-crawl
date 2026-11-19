import type { MouseEvent } from "react";
export function interceptHostNavigation(
  event: MouseEvent<HTMLAnchorElement>,
  onNavigate?: (href: string) => void,
) {
  if (!onNavigate) return;
  event.preventDefault();
  onNavigate(event.currentTarget.getAttribute("href") ?? "");
}
