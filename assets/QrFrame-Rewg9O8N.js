var e=`import type { ComponentPropsWithoutRef } from "react";

export default function QrFrame({
  variant,
  className = "",
  ...props
}: ComponentPropsWithoutRef<"div"> & { variant?: "host" }) {
  return (
    <div
      {...props}
      className={\`qr-frame\${variant ? \` qr-frame--\${variant}\` : ""} \${className}\`.trim()}
    />
  );
}
`;export{e as default};