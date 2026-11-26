var e=`export default function SlideshowEvidence({
  id,
  mediaType,
  src,
  alt,
  onEnded,
  onError,
}: {
  id: string;
  mediaType: "image" | "video";
  src: string;
  alt: string;
  onEnded: () => void;
  onError: (message: string) => void;
}) {
  if (mediaType === "video") {
    return (
      <video
        key={id}
        className="slideshow-evidence"
        src={src}
        autoPlay
        muted
        playsInline
        onEnded={onEnded}
        onError={() => onError("This video couldn't play on the TV screen.")}
      />
    );
  }
  return (
    <img
      className="slideshow-evidence"
      src={src}
      alt={alt}
      onError={() => onError("This photo couldn't load on the TV screen.")}
    />
  );
}
`;export{e as default};