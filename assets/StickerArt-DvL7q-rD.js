var e=`import type { ReactNode } from "react";
import Icon, { type IconName } from "./Icon";

export default function StickerArt({
  icon,
  children,
}: {
  icon: IconName;
  children: ReactNode;
}) {
  return (
    <div className="sticker-art" aria-hidden="true">
      <Icon name={icon} className="icon--size-52" />
      <span>{children}</span>
    </div>
  );
}
`;export{e as default};