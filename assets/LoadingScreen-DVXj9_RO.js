var e=`import type { ReactNode } from "react";
import Spinner from "./Spinner";
export default function LoadingScreen({
  children,
  as: Element = "main",
}: {
  children: ReactNode;
  as?: "main" | "div";
}) {
  return (
    <Element className="loading-screen">
      <Spinner />
      {children}
    </Element>
  );
}
`;export{e as default};