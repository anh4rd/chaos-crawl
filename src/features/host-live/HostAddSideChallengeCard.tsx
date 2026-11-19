import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";

export default function HostAddSideChallengeCard({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      className="host-side-challenge-add"
      aria-label="Add side challenge"
      title="Add side challenge"
      disabled={disabled}
      onClick={onClick}
    >
      <span className="host-side-challenge-add__icon" aria-hidden="true">
        <Icon name="plus" className="icon--size-20" />
      </span>
    </Button>
  );
}
