var e=`import CountBadge from "../ui/CountBadge";
import Button from "../ui/Button";

type Props = {
  round: number | null;
  title: string;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
} & (
  | { variant: "detailed"; description: string | null; points: number }
  | { variant?: "chip" }
);
export default function RoundChoice(props: Props) {
  if (props.variant === "detailed")
    return (
      <Button
        fullWidth={false}
        type="button"
        className={\`round-choice\${props.selected ? " round-choice--current" : ""}\`}
        onClick={props.onSelect}
        disabled={props.disabled}
      >
        <CountBadge
          variant={props.selected ? "round-index-current" : "round-index"}
        >
          {props.round}
        </CountBadge>
        <span className="round-choice__copy">
          <strong>{props.title}</strong>
          <small>{props.description}</small>
        </span>
        <span className="round-choice__points">{props.points} pts</span>
      </Button>
    );
  return (
    <Button
      type="button"
      variant={props.selected ? "round-chip-current" : "round-chip"}
      fullWidth={false}
      disabled={props.disabled}
      onClick={props.onSelect}
    >
      {props.round}. {props.title}
    </Button>
  );
}
`;export{e as default};