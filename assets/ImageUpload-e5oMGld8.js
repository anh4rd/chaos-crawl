var e=`import { buttonClasses } from "./buttonClasses";
import Icon from "./Icon";
export default function ImageUpload({
  label,
  description,
  imageSrc,
  alt,
  onFile,
}: {
  label: string;
  description: string;
  imageSrc?: string;
  alt: string;
  onFile: (file: File) => void | Promise<void>;
}) {
  return (
    <div className="image-upload">
      <div className="image-upload__preview">
        {imageSrc ? (
          <img src={imageSrc} alt={alt} />
        ) : (
          <Icon name="image-plus" className="icon--size-34" />
        )}
      </div>
      <div>
        <strong>{label}</strong>
        <p>{description}</p>
        <label
          className={buttonClasses({
            variant: "setup-upload",
            fullWidth: false,
            className: "image-upload__control",
          })}
        >
          <Icon name="upload" className="icon--size-15" /> Choose image
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onFile(file);
            }}
          />
        </label>
      </div>
    </div>
  );
}
`;export{e as default};