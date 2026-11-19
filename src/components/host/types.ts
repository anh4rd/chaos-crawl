import type { ReactNode } from "react";
export interface HostPreviewUser {
  id: string;
  displayName: string;
  email: string;
}
export interface HostShellContent {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showCreate?: boolean;
  readOnlyPreview?: boolean;
  contextPanel?: ReactNode;
  sidebar?: ReactNode;
  contentAs?: "main" | "div";
  onNavigate?: (href: string) => void;
}
export interface HostShellProps extends HostShellContent {
  displayName: string;
  homeHref: string;
  onSignOut: () => void;
  onCreate: () => void;
}
