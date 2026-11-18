import type { ComponentPropsWithoutRef } from "react";

type Props =
  | ({
      as: "form";
      variant?: "reveal" | "contribution" | "inspector";
    } & ComponentPropsWithoutRef<"form">)
  | ({
      as?: "section";
      variant?: "reveal" | "contribution" | "inspector";
    } & ComponentPropsWithoutRef<"section">);

export default function DialogPanel({
  as: Container = "section",
  className = "",
  variant,
  ...props
}: Props) {
  return (
    <Container
      {...props}
      className={`dialog-panel${Container === "form" ? " dialog-panel--form" : ""}${variant ? ` dialog-panel--${variant}` : ""} ${className}`.trim()}
    />
  );
}
