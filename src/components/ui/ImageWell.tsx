import type { ReactNode } from "react";
export default function ImageWell({
  as: Container = "div",
  variant,
  imageSrc,
  alt = "",
  children,
}: {
  as?: "div" | "span";
  variant: "badge" | "poster" | "portrait" | "team";
  imageSrc?: string | null;
  alt?: string;
  children: ReactNode;
}) {
  return (
    <Container className={`image-well image-well--${variant}`}>
      {imageSrc ? <img src={imageSrc} alt={alt} /> : children}
    </Container>
  );
}
