var e=`import type { ComponentPropsWithoutRef } from "react";
export default function MascotArt({
  className = "",
  alt,
  ...props
}: Omit<ComponentPropsWithoutRef<"img">, "alt"> & { alt: string }) {
  return (
    <img {...props} alt={alt} className={\`mascot-art \${className}\`.trim()} />
  );
}
`;export{e as default};