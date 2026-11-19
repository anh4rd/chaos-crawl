import Badge from "../../components/ui/Badge";
import Icon from "../../components/ui/Icon";
import { componentCatalog } from "./catalog";
const sections = [
  ["foundations", "01", "Foundations"],
  ["primitives", "02", "UI primitives"],
  ["player", "03", "Shared sessions"],
  ["feedback", "04", "Feedback & states"],
  ["host", "05", "Host patterns"],
  ["catalog", "06", "Component catalog"],
] as const;
export default function StyleguideSidebar() {
  function jump(id: string) {
    document.getElementById(`sg-${id}`)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  }
  return (
    <aside className="reference-sidebar">
      <div className="reference-sidebar__label">
        <Icon name="layers3" className="icon--size-16" /> THE TOOLKIT
      </div>
      <nav
        className="reference-sidebar__navigation"
        aria-label="Styleguide sections"
      >
        {sections.map(([id, number, title]) => (
          <button
            className="reference-sidebar__button"
            type="button"
            key={id}
            onClick={() => jump(id)}
          >
            <span className="reference-sidebar__number">{number}</span>
            {title}
          </button>
        ))}
      </nav>
      <p className="reference-sidebar__copy">
        Real components.
        <br />
        Shared foundations.
        <br />A little more chaos.
      </p>
      <Badge variant="subtle" className="reference-sidebar__catalog-count">
        {componentCatalog.length} component modules
      </Badge>
    </aside>
  );
}
