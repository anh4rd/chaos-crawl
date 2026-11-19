import type { HTMLAttributes } from "react";

export default function PageIntroduction(
  props: HTMLAttributes<HTMLDivElement>,
) {
  return (
    <div
      {...props}
      className={`page-introduction ${props.className ?? ""}`.trim()}
    />
  );
}
