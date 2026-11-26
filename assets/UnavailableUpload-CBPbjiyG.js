var e=`import Button from "../ui/Button";
import Note from "../ui/Note";

export default function UnavailableUpload({ next }: { next: () => void }) {
  return (
    <div className="unavailable-upload">
      <h2 className="unavailable-upload__title">Could not load this upload</h2>
      <Note variant="media-unavailable">
        The file may be unavailable or use an unsupported format.
      </Note>
      <div className="unavailable-upload__action">
        <Button type="button" onClick={next}>
          Skip to next
        </Button>
      </div>
    </div>
  );
}
`;export{e as default};