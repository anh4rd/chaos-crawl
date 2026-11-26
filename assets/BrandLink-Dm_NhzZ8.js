var e=`import { Link, type LinkProps } from "react-router-dom";
import Icon from "./Icon";
interface Props extends Omit<LinkProps, "to"> {
  to?: LinkProps["to"];
  variant?: "compact" | "host";
  iconClassName?: string;
}
export default function BrandLink({
  children = "CHAOS CRAWL",
  to = "/",
  variant,
  iconClassName = "icon--size-21",
  className = "",
  ...props
}: Props) {
  return (
    <Link
      {...props}
      to={to}
      className={\`brand-link\${variant ? \` brand-link--\${variant}\` : ""} \${className}\`.trim()}
    >
      {variant === "host" ? (
        <>
          <span className="brand-link__mark">
            <Icon name="sparkles" className={iconClassName} />
          </span>
          <span>
            CHAOS<span className="brand-link__accent">CRAWL</span>
          </span>
        </>
      ) : variant === "compact" ? (
        <>
          <Icon name="sparkles" className="icon--size-23" />
          <span>
            CHAOS<span className="brand-link__accent">CRAWL</span>
          </span>
        </>
      ) : (
        children
      )}
    </Link>
  );
}
`;export{e as default};