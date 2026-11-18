import type { ReactNode } from "react";
import EvidenceReviewItem, {
  type EvidenceReviewMedia,
} from "./EvidenceReviewItem";

export default function EvidenceReview({
  items,
  heading,
}: {
  items: EvidenceReviewMedia[];
  heading?: ReactNode;
}) {
  if (items.length === 0) return null;
  return (
    <div className="evidence-review">
      {heading !== undefined && <strong>{heading}</strong>}
      <div className="evidence-review__grid">
        {items.map((item) => (
          <EvidenceReviewItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
