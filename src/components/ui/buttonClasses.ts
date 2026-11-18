export type ButtonVariant =
  | "access"
  | "access-back"
  | "access-switch"
  | "reveal"
  | "team-create"
  | "session-action"
  | "session-secondary"
  | "session-ghost"
  | "overlay-dismiss"
  | "review"
  | "review-primary"
  | "review-comic"
  | "review-comic-primary"
  | "session-send"
  | "round-primary"
  | "round-secondary"
  | "round-finish"
  | "round-chip"
  | "round-chip-current"
  | "session-edit"
  | "dialog"
  | "dialog-primary"
  | "dialog-dismiss"
  | "control"
  | "control-primary"
  | "control-replay"
  | "timer-menu"
  | "flow"
  | "flow-action"
  | "session-tour"
  | "lobby-action"
  | "lobby-save"
  | "lobby-choice"
  | "lobby-player"
  | "lobby-member"
  | "lobby-join"
  | "lobby-add"
  | "lobby-shortcut"
  | "lobby-back"
  | "lobby-next"
  | "poster-primary"
  | "poster-secondary"
  | "text"
  | "setup-upload"
  | "setup-primary"
  | "setup-secondary"
  | "setup-text"
  | "setup-icon"
  | "setup-filter"
  | "setup-favourite"
  | "setup-select"
  | "setup-move"
  | "comic"
  | "comic-primary"
  | "comic-secondary"
  | "comic-lime"
  | "comic-ghost"
  | "comic-icon"
  | "comic-icon-danger";
export function buttonClasses({
  variant,
  fullWidth,
  className,
}: {
  variant?: ButtonVariant;
  fullWidth: boolean;
  className: string;
}) {
  let appearance = variant;
  const review = variant?.startsWith("review");
  const reviewComic = review && variant?.includes("comic");
  const reviewPrimary = review && variant?.endsWith("primary");
  if (review) appearance = reviewComic ? "comic" : undefined;
  const reviewClass = review
    ? ` btn--review${reviewPrimary ? " btn--review-primary" : ""}${reviewComic ? "" : " btn--review-native"}`
    : "";
  if (variant === "session-send") appearance = "comic-lime";
  if (variant === "session-action") appearance = "comic-lime";
  if (variant === "session-secondary") appearance = "comic-secondary";
  if (variant === "session-ghost") appearance = "comic-ghost";
  const sessionClass =
    variant === "session-action" || variant === "session-send"
      ? " btn--session-action"
      : variant === "session-secondary" || variant === "session-ghost"
        ? ` btn--${variant}`
        : "";
  if (variant === "round-primary") appearance = "comic-primary";
  if (variant === "round-secondary") appearance = "comic-secondary";
  if (variant === "round-finish") appearance = "comic-ghost";
  const round = variant === "round-primary" || variant === "round-secondary";
  const roundClass = round
    ? " btn--round"
    : variant === "round-finish"
      ? " btn--round-finish"
      : "";
  const chipBase = variant === "round-chip-current" ? " btn--round-chip" : "";
  const comicTone =
    appearance?.startsWith("comic-") && !appearance.startsWith("comic-icon");
  const comic = appearance === "comic" || comicTone;
  const controlBase = variant?.startsWith("control-") ? " btn--control" : "";
  const flowBase = variant === "flow-action" ? " btn--flow" : "";
  const dialogBase = variant === "dialog-primary" ? " btn--dialog" : "";
  return `btn${reviewClass}${sessionClass}${variant === "session-send" ? " btn--session-send" : ""}${roundClass}${chipBase}${dialogBase}${controlBase}${flowBase}${comicTone ? " btn--comic" : ""}${appearance === "comic-icon-danger" ? " btn--comic-icon" : ""}${appearance ? ` btn--${appearance}` : ""}${fullWidth ? " btn--block" : ""}${comic && fullWidth ? " btn--comic-block" : ""} ${className}`.trim();
}
