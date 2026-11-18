import type { ComponentPropsWithoutRef } from "react";

export default function SubmissionList({
  className = "",
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return <div {...props} className={`submission-list ${className}`.trim()} />;
}
