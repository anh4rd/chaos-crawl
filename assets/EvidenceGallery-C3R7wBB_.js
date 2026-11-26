var e=`import type { EvidencePresentation } from "./types";

export default function EvidenceGallery({
  items,
}: {
  items: EvidencePresentation[];
}) {
  return (
    <div className="evidence-gallery">
      {items.map((item) => (
        <div key={item.id} className="evidence-gallery__item">
          {item.mediaType === "video" ? (
            <video
              src={item.url}
              controls
              playsInline
              preload="metadata"
              aria-label={item.description}
            />
          ) : (
            <img src={item.url} alt={item.description} loading="lazy" />
          )}
        </div>
      ))}
    </div>
  );
}
`;export{e as default};