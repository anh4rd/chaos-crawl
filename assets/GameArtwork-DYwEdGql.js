var e=`import type { ReactNode } from "react";
import MascotArt from "../ui/MascotArt";

export default function GameArtwork({ children }: { children: ReactNode }) {
  return (
    <div className="game-artwork">
      <MascotArt
        className="mascot-art--game"
        src={\`\${import.meta.env.BASE_URL}chaos-monster-peek.png\`}
        alt=""
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
`;export{e as default};