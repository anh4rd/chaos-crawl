import { useEffect, useRef, useState } from "react";
import Button from "../ui/Button";
import Icon from "../ui/Icon";
import SessionFeedback from "./SessionFeedback";
import SessionSocialClipCreator from "./SessionSocialClipCreator";
import type { SessionMemoryItem } from "./types";

type DownloadAsset = (
  storagePath: string,
) => Promise<{ data: Blob | null; error: { message: string } | null }>;

function downloadName(asset: SessionMemoryItem, index: number) {
  const extension = asset.storagePath.split(".").pop()?.toLowerCase() || "file";
  const title =
    asset.title
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "submission";
  return `chaos-crawl-${String(index + 1).padStart(2, "0")}-${title}.${extension}`;
}

function submittedDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Submission"
    : date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

export default function SessionMemories({
  assets,
  heading,
  description,
  reelCredit,
  joinCode,
  downloadAsset,
}: {
  assets: SessionMemoryItem[];
  heading: string;
  description: string;
  reelCredit: string;
  joinCode: string;
  downloadAsset: DownloadAsset;
}) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const activeDownload = useRef(false);
  const pendingRevocations = useRef(new Map<string, number>());

  useEffect(
    () => () => {
      pendingRevocations.current.forEach((timer, url) => {
        window.clearTimeout(timer);
        URL.revokeObjectURL(url);
      });
      pendingRevocations.current.clear();
    },
    [],
  );

  async function saveAsset(asset: SessionMemoryItem, index: number) {
    if (activeDownload.current) return;
    activeDownload.current = true;
    setDownloadingId(asset.id);
    setError("");
    try {
      const result = await downloadAsset(asset.storagePath);
      if (result.error || !result.data) {
        setError(
          result.error?.message ?? "The original file could not be downloaded.",
        );
        return;
      }

      const url = URL.createObjectURL(result.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = downloadName(asset, index);
      document.body.append(link);
      link.click();
      link.remove();
      const timer = window.setTimeout(() => {
        URL.revokeObjectURL(url);
        pendingRevocations.current.delete(url);
      }, 1000);
      pendingRevocations.current.set(url, timer);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "The original file could not be downloaded.",
      );
    } finally {
      setDownloadingId(null);
      activeDownload.current = false;
    }
  }

  return (
    <section
      className="session-memories"
      aria-labelledby="session-memories-heading"
      data-tour="session-memories"
    >
      <header className="session-memories__header">
        <div>
          <p className="session-memories__eyebrow">Game complete</p>
          <h2 id="session-memories-heading">{heading}</h2>
          <p>{description}</p>
        </div>
        <div className="session-memories__count">
          <Icon
            name="image-plus"
            className="icon--size-18"
            aria-hidden="true"
          />
          <span>{assets.length} uploads</span>
        </div>
      </header>

      {error && <SessionFeedback message={error} />}

      {assets.length === 0 ? (
        <div className="session-memories__empty">
          <Icon name="camera" className="icon--size-24" aria-hidden="true" />
          <h3>No uploads this time</h3>
          <p>Photos and videos submitted during the game appear here.</p>
        </div>
      ) : (
        <>
          <div className="session-memories__grid">
            {assets.map((asset, index) => (
              <article className="session-memories__asset" key={asset.id}>
                <div className="session-memories__preview">
                  {asset.mediaType === "image" ? (
                    <img
                      src={asset.mediaUrl}
                      alt={asset.title}
                      loading="lazy"
                    />
                  ) : (
                    <div className="session-memories__video">
                      <Icon
                        name="film"
                        className="icon--size-28"
                        aria-hidden="true"
                      />
                      <span>Video submission</span>
                    </div>
                  )}
                  <span className="session-memories__type">
                    {asset.mediaType === "image" ? "Photo" : "Video"}
                  </span>
                </div>
                <div className="session-memories__asset-details">
                  <div>
                    <h3>{asset.title}</h3>
                    <p>
                      {submittedDate(asset.submittedAt)}
                      {asset.submittedBy && ` · ${asset.submittedBy}`}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="session-secondary"
                    fullWidth={false}
                    aria-label={`${downloadingId === asset.id ? "Preparing download of" : "Download"} ${asset.title}`}
                    aria-busy={downloadingId === asset.id}
                    onClick={() => void saveAsset(asset, index)}
                  >
                    <Icon
                      name="arrow-down"
                      className="icon--size-16"
                      aria-hidden="true"
                    />
                    {downloadingId === asset.id ? "Preparing…" : "Download"}
                  </Button>
                </div>
              </article>
            ))}
          </div>

          <SessionSocialClipCreator
            assets={assets.filter((asset) => asset.mediaType === "image")}
            reelCredit={reelCredit}
            joinCode={joinCode}
            downloadAsset={downloadAsset}
          />
        </>
      )}
    </section>
  );
}
