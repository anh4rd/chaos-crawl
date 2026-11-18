import type { Media } from "../../types/database";

export default function UploadCaption({
  media,
}: {
  media: Pick<Media, "pub" | "challenge" | "player_name" | "team">;
}) {
  return (
    <div className="upload-caption">
      {media.pub && <p className="upload-caption__location">📍 {media.pub}</p>}
      {media.challenge && (
        <h1 className="upload-caption__title">{media.challenge}</h1>
      )}
      {media.player_name && (
        <p className="upload-caption__player">
          {media.player_name}
          {media.team ? ` • ${media.team}` : ""}
        </p>
      )}
    </div>
  );
}
