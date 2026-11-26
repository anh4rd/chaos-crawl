var e=`import ContentPanel from "../ui/ContentPanel";
import PanelHeading from "../ui/PanelHeading";
import Overline from "../ui/Overline";
import CountBadge from "../ui/CountBadge";
import RoundSelector from "./RoundSelector";

export default function RoundPlan({
  rounds,
  currentRound,
  interactive,
  busy,
  onSelect,
}: {
  rounds: {
    id: string;
    round: number | null;
    title: string;
    description: string | null;
    points: number;
  }[];
  currentRound: number;
  interactive: boolean;
  busy: boolean;
  onSelect: (round: number) => void;
}) {
  return (
    <ContentPanel variant="session" stacked>
      <PanelHeading variant="session">
        <div>
          <Overline as="div" variant="session">
            ROUND PLAN
          </Overline>
          <h2>Your challenges</h2>
          <p>
            Jump to a round at any time while the game is live, including
            previous rounds.
          </p>
        </div>
        <CountBadge variant="session">{rounds.length} rounds</CountBadge>
      </PanelHeading>
      <RoundSelector
        variant="detailed"
        rounds={rounds}
        currentRound={currentRound}
        interactive={interactive}
        busy={busy}
        onSelect={onSelect}
      />
    </ContentPanel>
  );
}
`;export{e as default};