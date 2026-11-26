var e=`import type { ReactNode } from "react";
import Overline from "../ui/Overline";

export default function SlideshowCaption({
  kicker,
  title,
}: {
  kicker: ReactNode;
  title: string;
}) {
  return (
    <div className="slideshow-caption">
      <Overline variant="slideshow">{kicker}</Overline>
      <h1>{title}</h1>
    </div>
  );
}
`;export{e as default};