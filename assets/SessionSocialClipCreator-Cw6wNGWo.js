var e=`import { useEffect, useRef, useState } from "react";
import Button from "../ui/Button";
import Icon from "../ui/Icon";
import SessionFeedback from "./SessionFeedback";
import type { SessionMemoryItem } from "./types";

const maxClipPhotos = 8;
const slideDurationMs = 1800;

type DownloadAsset = (
  storagePath: string,
) => Promise<{ data: Blob | null; error: { message: string } | null }>;

async function loadPhoto(
  asset: SessionMemoryItem,
  downloadAsset: DownloadAsset,
) {
  const result = await downloadAsset(asset.storagePath);
  if (result.error || !result.data)
    throw new Error(
      result.error?.message ?? \`Couldn't load \${asset.title} for the clip.\`,
    );

  const url = URL.createObjectURL(result.data);
  const image = new Image();
  image.src = url;
  try {
    await image.decode();
    return { image, url };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error(\`Couldn't prepare \${asset.title} for the clip.\`);
  }
}

function drawPhotoSlide(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  title: string,
  reelCredit: string,
) {
  const styles = getComputedStyle(canvas);
  const background = styles
    .getPropertyValue("--session-clip-background")
    .trim();
  const foreground = styles
    .getPropertyValue("--session-clip-foreground")
    .trim();
  const accent = styles.getPropertyValue("--session-clip-accent").trim();
  const font = styles.getPropertyValue("--session-clip-font").trim();
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = accent;
  context.font = \`700 22px \${font}\`;
  context.fillText("CHAOS CRAWL", canvas.width / 2, 95);
  context.fillStyle = foreground;
  context.font = \`700 42px \${font}\`;
  context.fillText(reelCredit, canvas.width / 2, 175, canvas.width - 80);

  const frame = {
    x: 42,
    y: 270,
    width: canvas.width - 84,
    height: 730,
  };
  const scale = Math.max(
    frame.width / image.naturalWidth,
    frame.height / image.naturalHeight,
  );
  const imageWidth = image.naturalWidth * scale;
  const imageHeight = image.naturalHeight * scale;
  context.save();
  context.beginPath();
  context.rect(frame.x, frame.y, frame.width, frame.height);
  context.clip();
  context.drawImage(
    image,
    frame.x + (frame.width - imageWidth) / 2,
    frame.y + (frame.height - imageHeight) / 2,
    imageWidth,
    imageHeight,
  );
  context.restore();

  context.fillStyle = accent;
  context.fillRect(42, 1050, canvas.width - 84, 5);
  context.fillStyle = foreground;
  context.font = \`700 30px \${font}\`;
  context.fillText(title, canvas.width / 2, 1115, canvas.width - 100);
  context.font = \`500 22px \${font}\`;
  context.fillText("OUR GAME. OUR CHAOS.", canvas.width / 2, 1195);
}

function renderSlide(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  title: string,
  reelCredit: string,
) {
  return new Promise<void>((resolve) => {
    let startedAt: number | null = null;
    const draw = (time: number) => {
      startedAt ??= time;
      drawPhotoSlide(context, canvas, image, title, reelCredit);
      if (time - startedAt >= slideDurationMs) resolve();
      else window.requestAnimationFrame(draw);
    };
    window.requestAnimationFrame(draw);
  });
}

function downloadClip(blob: Blob, joinCode: string) {
  const extension = blob.type.includes("mp4") ? "mp4" : "webm";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = \`chaos-crawl-\${joinCode}-photo-reel.\${extension}\`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function SessionSocialClipCreator({
  assets,
  reelCredit,
  joinCode,
  downloadAsset,
}: {
  assets: SessionMemoryItem[];
  reelCredit: string;
  joinCode: string;
  downloadAsset: DownloadAsset;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const photoIds = assets.map((asset) => asset.id);
  const photoIdsKey = photoIds.join("|");

  useEffect(() => {
    setSelectedIds(
      photoIdsKey ? photoIdsKey.split("|").slice(0, maxClipPhotos) : [],
    );
  }, [photoIdsKey]);

  function togglePhoto(id: string, checked: boolean) {
    setSelectedIds((current) => {
      if (!checked) return current.filter((selectedId) => selectedId !== id);
      if (current.includes(id) || current.length >= maxClipPhotos)
        return current;
      return [...current, id];
    });
  }

  async function createClip() {
    setError("");
    if (typeof MediaRecorder === "undefined") {
      setError(
        "This browser can't create a video clip. Download the originals instead.",
      );
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const selectedPhotos = assets.filter((asset) =>
      selectedIds.includes(asset.id),
    );
    const mimeType = [
      "video/mp4",
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ].find((type) => MediaRecorder.isTypeSupported(type));

    if (selectedPhotos.length === 0) {
      setError("Choose at least one photo for your reel.");
      return;
    }

    if (!canvas || !context || !canvas.captureStream || !mimeType) {
      setError(
        "This browser can't create a video clip. Download the originals instead.",
      );
      return;
    }

    let recorder: MediaRecorder | null = null;
    let finished: Promise<Blob> | null = null;
    let recordingFailed = false;
    let stream: MediaStream | null = null;
    const imageUrls = new Set<string>();
    setCreating(true);
    setProgress("Starting your photo reel…");

    try {
      const firstPhoto = await loadPhoto(selectedPhotos[0], downloadAsset);
      imageUrls.add(firstPhoto.url);
      stream = canvas.captureStream(30);
      recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];
      finished = new Promise((resolve) => {
        recorder?.addEventListener(
          "stop",
          () => resolve(new Blob(chunks, { type: mimeType })),
          { once: true },
        );
      });
      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      });
      recorder.addEventListener(
        "error",
        () => {
          recordingFailed = true;
          if (recorder?.state === "recording") recorder.stop();
        },
        { once: true },
      );
      recorder.start(250);

      for (let index = 0; index < selectedPhotos.length; index += 1) {
        setProgress(\`Building photo \${index + 1} of \${selectedPhotos.length}…\`);
        const photo =
          index === 0
            ? firstPhoto
            : await loadPhoto(selectedPhotos[index], downloadAsset);
        imageUrls.add(photo.url);
        await renderSlide(
          context,
          canvas,
          photo.image,
          selectedPhotos[index].title,
          reelCredit,
        );
        URL.revokeObjectURL(photo.url);
        imageUrls.delete(photo.url);
      }

      if (recorder.state === "recording") recorder.stop();
      const clip = await finished;
      if (recordingFailed || !clip.size)
        throw new Error("The browser couldn't finish recording this clip.");
      downloadClip(clip, joinCode);
      setProgress("Your photo reel is ready.");
    } catch (clipError) {
      if (recorder?.state === "recording") {
        recorder.stop();
        if (finished) await finished;
      }
      setProgress("");
      setError(
        clipError instanceof Error
          ? clipError.message
          : "The photo reel couldn't be created. Download the originals instead.",
      );
    } finally {
      imageUrls.forEach((url) => URL.revokeObjectURL(url));
      stream?.getTracks().forEach((track) => track.stop());
      setCreating(false);
    }
  }

  return (
    <section
      className="session-social-clip"
      aria-labelledby="session-social-clip-heading"
    >
      <div className="session-social-clip__copy">
        <p className="session-social-clip__eyebrow">Make something shareable</p>
        <h3 id="session-social-clip-heading">Your 9:16 photo reel</h3>
        <p>
          Turn up to {maxClipPhotos} of these photos into a short, silent
          vertical video. Your original videos are still available to download
          above.
        </p>
      </div>

      {assets.length === 0 ? (
        <p className="session-social-clip__empty">
          Photo submissions can be selected here to make a reel.
        </p>
      ) : (
        <>
          <fieldset className="session-social-clip__photos" disabled={creating}>
            <legend>
              Pick photos{" "}
              <span className="session-social-clip__photo-limit">
                {selectedIds.length}/{maxClipPhotos}
              </span>
            </legend>
            {assets.map((asset) => (
              <label className="session-social-clip__photo" key={asset.id}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(asset.id)}
                  onChange={(event) =>
                    togglePhoto(asset.id, event.currentTarget.checked)
                  }
                />
                <span>{asset.title}</span>
              </label>
            ))}
          </fieldset>
          {assets.length > maxClipPhotos && (
            <p className="session-social-clip__hint">
              Choose up to {maxClipPhotos} photos for one reel.
            </p>
          )}
          {error && <SessionFeedback message={error} />}
          {progress && (
            <output className="session-social-clip__progress">
              {progress}
            </output>
          )}
          <Button
            type="button"
            variant="session-action"
            fullWidth={false}
            disabled={creating || selectedIds.length === 0}
            onClick={() => void createClip()}
          >
            <Icon name="film" className="icon--size-18" aria-hidden="true" />
            {creating ? "Making your reel…" : "Create and download reel"}
          </Button>
        </>
      )}

      <canvas
        ref={canvasRef}
        className="session-social-clip__canvas"
        width={720}
        height={1280}
        aria-hidden="true"
      />
    </section>
  );
}
`;export{e as default};