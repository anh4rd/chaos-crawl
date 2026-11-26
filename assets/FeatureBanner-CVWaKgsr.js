var e=`import type { ReactNode } from "react";
import Overline from "./Overline";

export default function FeatureBanner({
  eyebrow,
  title,
  children,
  artwork,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  artwork: ReactNode;
}) {
  return (
    <section className="feature-banner">
      <div className="feature-banner__copy">
        <Overline variant="banner">{eyebrow}</Overline>
        <h2>{title}</h2>
        <p>{children}</p>
      </div>
      {artwork}
    </section>
  );
}
`;export{e as default};