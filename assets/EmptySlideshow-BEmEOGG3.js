var e=`import Button from "../ui/Button";
import Note from "../ui/Note";

export default function EmptySlideshow({
  reload,
}: {
  reload: () => Promise<void>;
}) {
  return (
    <div className="empty-slideshow">
      <h1 className="empty-slideshow__title">Anna&apos;s Chaos Crawl</h1>
      <Note variant="playback-waiting">Waiting for chaos...</Note>
      <div className="empty-slideshow__action">
        <Button type="button" onClick={() => void reload()}>
          Check for uploads
        </Button>
      </div>
    </div>
  );
}
`;export{e as default};