import { challengeArtwork } from "../../lib/openmoji";

export default function ChallengeArtwork({
  selection,
  title,
  description = "",
}: {
  selection?: string;
  title: string;
  description?: string;
}) {
  const artwork = challengeArtwork(selection, title, description);
  return artwork.src ? (
    <img src={artwork.src} alt="" aria-hidden="true" />
  ) : (
    <span aria-hidden="true">{artwork.emoji}</span>
  );
}
