var e=`import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
export default function PlanNavigation({
  stage,
  previousLabel,
  nextLabel,
  saving = false,
  onBack,
  onNext,
  onSave,
}: {
  stage: "create" | "build";
  previousLabel?: string;
  nextLabel?: string;
  saving?: boolean;
  onBack?: () => void;
  onNext: () => void;
  onSave?: () => void;
}) {
  if (stage === "create")
    return (
      <nav className="plan-navigation" aria-label="Game setup navigation">
        <Button
          type="button"
          variant="setup-secondary"
          fullWidth={false}
          disabled
        >
          <Icon name="arrow-left" className="icon--size-16" /> Back
        </Button>
        <Button
          type="button"
          variant="setup-primary"
          fullWidth={false}
          onClick={onNext}
        >
          Next: Players &amp; Teams{" "}
          <Icon name="arrow-right" className="icon--size-17" />
        </Button>
      </nav>
    );
  return (
    <nav className="plan-navigation" aria-label="Game setup navigation">
      <Button
        type="button"
        variant="setup-secondary"
        fullWidth={false}
        onClick={onBack}
      >
        <Icon name="arrow-left" className="icon--size-16" /> Back
        {previousLabel ? \`: \${previousLabel}\` : ": Game basics"}
      </Button>
      <div className="plan-navigation__actions">
        <Button
          type="button"
          variant="setup-secondary"
          fullWidth={false}
          disabled={saving}
          onClick={onSave}
        >
          Save draft
        </Button>
        <Button
          type="button"
          variant="setup-primary"
          fullWidth={false}
          disabled={saving}
          onClick={onNext}
        >
          {saving
            ? "Saving…"
            : nextLabel
              ? \`Next: \${nextLabel}\`
              : "Save game plan"}
          {nextLabel ? (
            <Icon name="arrow-right" className="icon--size-16" />
          ) : (
            <Icon name="check-circle2" className="icon--size-16" />
          )}
        </Button>
      </div>
    </nav>
  );
}
`;export{e as default};