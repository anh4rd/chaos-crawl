import { useState } from "react";
import SessionMemories from "../../components/session/SessionMemories";
import type { SessionMemoryItem } from "../../components/session/types";
import DemoNotice from "../../components/ui/DemoNotice";

const memories: SessionMemoryItem[] = [
  {
    id: "local-memory-photo",
    title: "Best entrance of the night",
    mediaType: "image",
    mediaUrl: `${import.meta.env.BASE_URL}chaos-logo.png`,
    storagePath: "local-preview/entrance.png",
    submittedAt: "2030-01-01T18:30:00Z",
    submittedBy: "Alex",
  },
  {
    id: "local-memory-video",
    title: "The victory dance",
    mediaType: "video",
    mediaUrl: "",
    storagePath: "local-preview/victory.webm",
    submittedAt: "2030-01-01T19:00:00Z",
    submittedBy: "Sam",
  },
];

async function downloadDemoAsset() {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}chaos-logo.png`);
    if (!response.ok)
      return {
        data: null,
        error: { message: "The local preview image could not be loaded." },
      };
    return { data: await response.blob(), error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        message:
          error instanceof Error
            ? error.message
            : "The local preview image could not be loaded.",
      },
    };
  }
}

export default function SessionMemoriesExample() {
  const [previewKey, setPreviewKey] = useState(0);
  return (
    <>
      <DemoNotice
        actionLabel="Reset preview"
        onAction={() => setPreviewKey((current) => current + 1)}
      >
        Local session archive preview — downloads use a bundled image only.
      </DemoNotice>
      <div key={previewKey}>
        <SessionMemories
          assets={memories}
          heading="Memories from the game."
          description="Download original submissions from everyone in Friday Night Chaos, or make a group photo reel to share."
          reelCredit="The whole crew"
          joinCode="123456"
          downloadAsset={downloadDemoAsset}
        />
      </div>
    </>
  );
}
