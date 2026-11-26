var e=`import ImageWell from "../../components/ui/ImageWell";
import GameArtwork from "../../components/session/GameArtwork";

export default function LobbyGameHeading({
  name,
  photoUrl,
  compact = false,
}: {
  name: string;
  photoUrl: string | null;
  compact?: boolean;
}) {
  return (
    <div
      className={\`lobby-game-heading\${compact ? " lobby-game-heading--compact" : ""}\`}
      data-tour="host-overview"
    >
      <GameArtwork>
        <ImageWell variant="badge" imageSrc={photoUrl}>
          <span aria-hidden="true">🎉</span>
        </ImageWell>
      </GameArtwork>
      <h2>{name}</h2>
    </div>
  );
}
`;export{e as default};