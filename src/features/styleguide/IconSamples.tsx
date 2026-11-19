import Icon from "../../components/ui/Icon";
export default function IconSamples() {
  return (
    <div className="icon-samples" aria-label="Lucide icon examples">
      <Icon name="star" className="icon--size-24" aria-label="Star" />
      <Icon name="trophy" className="icon--size-24" aria-label="Trophy" />
      <Icon name="sparkles" className="icon--size-24" aria-label="Sparkles" />
      <Icon name="copy" className="icon--size-24" aria-label="Copy" />
      <span>lucide-react · label icon-only actions</span>
    </div>
  );
}
