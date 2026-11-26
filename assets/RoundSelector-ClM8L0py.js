var e=`import RoundChoice from "./RoundChoice";

type Round = { id: string; round: number | null; title: string };
type Props = {
  currentRound: number;
  busy: boolean;
  onSelect: (round: number) => void;
} & (
  | { variant?: "chips"; rounds: Round[] }
  | {
      variant: "detailed";
      interactive: boolean;
      rounds: (Round & { description: string | null; points: number })[];
    }
);
export default function RoundSelector(props: Props) {
  if (props.variant === "detailed")
    return (
      <div className="round-selector round-selector--detailed">
        {props.rounds.map((round) => (
          <RoundChoice
            key={round.id}
            variant="detailed"
            round={round.round}
            title={round.title}
            description={round.description}
            points={round.points}
            selected={props.interactive && round.round === props.currentRound}
            disabled={
              !props.interactive ||
              props.busy ||
              round.round === props.currentRound
            }
            onSelect={() => props.onSelect(Number(round.round))}
          />
        ))}
      </div>
    );
  return (
    <div className="round-selector" aria-label="Jump to round">
      {props.rounds.map((round) => (
        <RoundChoice
          key={round.id}
          round={round.round}
          title={round.title}
          selected={round.round === props.currentRound}
          disabled={props.busy || round.round === props.currentRound}
          onSelect={() => props.onSelect(Number(round.round))}
        />
      ))}
    </div>
  );
}
`;export{e as default};