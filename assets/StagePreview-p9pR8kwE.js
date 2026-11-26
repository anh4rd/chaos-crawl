var e=`import Badge from "../ui/Badge";
import IconBadge from "../ui/IconBadge";
import type { ReactNode } from "react";

export default function StagePreview({
  label,
  illustration,
  title,
  description,
  highlighted,
  children,
}: {
  label: string;
  illustration: ReactNode;
  title: string;
  description: string | null;
  highlighted: boolean;
  children?: ReactNode;
}) {
  return (
    <article
      className={\`stage-preview\${highlighted ? " stage-preview--highlighted" : ""}\`}
    >
      <div>
        <Badge variant={highlighted ? "stage-break" : "stage"}>{label}</Badge>
        <div className="stage-preview__heading">
          <IconBadge
            as="b"
            variant={highlighted ? "stage-break" : "stage"}
            aria-hidden="true"
          >
            {illustration}
          </IconBadge>
          <strong className="stage-preview__title">{title}</strong>
        </div>
        <small className="stage-preview__description">{description}</small>
      </div>
      {children}
    </article>
  );
}
`;export{e as default};