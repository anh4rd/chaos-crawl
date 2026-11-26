var e=`import Button from "../ui/Button";
import Icon from "../ui/Icon";

export default function SessionTourPrompt({
  label,
  dismissLabel,
  onStart,
  onDismiss,
}: {
  label: string;
  dismissLabel: string;
  onStart: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="session-tour-prompt">
      <Button
        variant="session-tour"
        fullWidth={false}
        type="button"
        onClick={onStart}
      >
        {label}
      </Button>
      <Button
        variant="session-tour"
        className="session-tour-prompt__dismiss"
        fullWidth={false}
        type="button"
        aria-label={dismissLabel}
        onClick={onDismiss}
      >
        <Icon name="x" className="icon--size-18" aria-hidden="true" />
      </Button>
    </div>
  );
}
`;export{e as default};