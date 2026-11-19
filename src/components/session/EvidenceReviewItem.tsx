import type { EvidencePresentation } from "./types";

export interface EvidenceReviewMedia extends EvidencePresentation {
  labels: string[];
}

export default function EvidenceReviewItem({
  item,
}: {
  item: EvidenceReviewMedia;
}) {
  return (
    <div className="evidence-review-item">
      {item.mediaType === "video" ? (
        <video src={item.url} controls playsInline preload="metadata" />
      ) : (
        <img src={item.url} alt={item.description} loading="lazy" />
      )}
      <div className="evidence-review-item__meta">
        {item.labels.map((label) => (
          <small key={label}>{label}</small>
        ))}
      </div>
    </div>
  );
}
