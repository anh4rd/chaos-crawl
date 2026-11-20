import SessionMemories from "../../components/session/SessionMemories";
import { downloadSessionEvidence } from "../../lib/sessionEvidence";
import type { SessionMemoryItem } from "../../components/session/types";
import type { PlayerMemoryAsset } from "./types";

export default function PlayerMemories({
  assets,
  mediaUrl,
  sessionName,
  playerName,
  joinCode,
}: {
  assets: PlayerMemoryAsset[];
  mediaUrl: (path: string) => string;
  sessionName: string;
  playerName: string;
  joinCode: string;
}) {
  const memories: SessionMemoryItem[] = assets.map((asset) => ({
    id: asset.id,
    title: asset.title,
    mediaType: asset.media_type,
    mediaUrl: mediaUrl(asset.storage_path),
    storagePath: asset.storage_path,
    submittedAt: asset.created_at,
  }));

  return (
    <SessionMemories
      assets={memories}
      heading="Keep your chaos."
      description={`Your submissions from ${sessionName} are all here. Download the originals or make a vertical photo reel to share.`}
      reelCredit={playerName}
      joinCode={joinCode}
      downloadAsset={downloadSessionEvidence}
    />
  );
}
