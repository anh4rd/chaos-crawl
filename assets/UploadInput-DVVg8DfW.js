var e=`import type { ComponentPropsWithRef } from "react";
export default function UploadInput({
  className = "",
  ...props
}: Omit<ComponentPropsWithRef<"input">, "type">) {
  return (
    <input
      type="file"
      {...props}
      className={\`upload-input \${className}\`.trim()}
    />
  );
}
`;export{e as default};