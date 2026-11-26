var e=`import type { HTMLAttributes } from "react";
export default function Avatar({
  name,
  imageSrc,
  variant = "account",
  as: Container = "span",
  className = "",
  ...props
}: HTMLAttributes<HTMLElement> & {
  name: string;
  imageSrc?: string | null;
  variant?:
    | "account"
    | "roster"
    | "compact"
    | "member"
    | "choice"
    | "console"
    | "directory";
  as?: "span" | "div";
}) {
  return (
    <Container
      {...props}
      className={\`avatar avatar--\${variant} \${className}\`.trim()}
    >
      {imageSrc ? (
        <img src={imageSrc} alt="" />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </Container>
  );
}
`;export{e as default};