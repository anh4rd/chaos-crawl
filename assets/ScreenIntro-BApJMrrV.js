var e=`import type { ReactNode } from "react";
import Card from "./Card";

export default function ScreenIntro({
  title,
  description,
}: {
  title: string;
  description: ReactNode;
}) {
  return (
    <Card className="screen-intro">
      <h1 className="screen-intro__title">{title}</h1>
      <p className="screen-intro__description">{description}</p>
    </Card>
  );
}
`;export{e as default};