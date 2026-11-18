export default function Avatar({
  name,
  imageSrc,
  variant = "account",
}: {
  name: string;
  imageSrc?: string | null;
  variant?: "account" | "roster" | "compact" | "member" | "choice";
}) {
  return (
    <span className={`avatar avatar--${variant}`}>
      {imageSrc ? (
        <img src={imageSrc} alt="" />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}
