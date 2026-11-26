var e=`import type { SelectHTMLAttributes } from "react";
export default function NativeSelect({
  spacing = "wide",
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  spacing?: "close" | "regular" | "wide";
}) {
  return (
    <select
      {...props}
      className={\`native-select native-select--\${spacing} \${className}\`.trim()}
    />
  );
}
`;export{e as default};