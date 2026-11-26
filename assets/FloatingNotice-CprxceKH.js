var e=`import type { ComponentPropsWithoutRef, ReactNode } from "react";
export default function FloatingNotice({
  message,
  icon,
  tone,
  className = "",
  ...props
}: Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  message: string;
  icon?: ReactNode;
  tone: "error" | "notice";
}) {
  return (
    <div
      {...props}
      className={\`floating-notice floating-notice--\${tone} \${className}\`.trim()}
    >
      {icon}
      <span>{message}</span>
    </div>
  );
}
`;export{e as default};