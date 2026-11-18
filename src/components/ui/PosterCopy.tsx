import type { HTMLAttributes } from "react";

export default function PosterCopy({
  className = "",
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={`poster-copy ${className}`.trim()} />;
}
