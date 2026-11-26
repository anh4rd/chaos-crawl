var e=`import Icon from "./Icon";
export default function CoverArtwork({
  name,
  imageSrc,
  variant = "plan",
  initial,
  iconClassName,
}: {
  name: string;
  initial?: string;
  iconClassName?: string;
  imageSrc?: string | null;
  variant?: "plan" | "overview";
}) {
  return (
    <div className={\`cover-art cover-art--\${variant}\`}>
      {imageSrc ? (
        <img src={imageSrc} alt={\`\${name} cover\`} />
      ) : (
        <>
          <Icon
            name="sparkles"
            className={
              iconClassName ??
              (variant === "plan" ? "icon--size-27" : "icon--size-30")
            }
          />
          <span>
            {initial ??
              (name.slice(0, 1).toUpperCase() ||
                (variant === "plan" ? "C" : ""))}
          </span>
        </>
      )}
    </div>
  );
}
`;export{e as default};