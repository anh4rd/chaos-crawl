var e=`import StepProgress from "../../components/ui/StepProgress";
import Overline from "../../components/ui/Overline";
import PanelHeading from "../../components/ui/PanelHeading";
import type { RoundProgressModel } from "./types";

export default function RoundProgress({
  roundLabel,
  revealedCount,
  totalCount,
  progressPercent,
}: RoundProgressModel) {
  return (
    <section className="round-progress">
      <PanelHeading variant="console-section">
        <div>
          <Overline variant="console-eyebrow" as="p">
            GAME PROGRESS
          </Overline>
          <h2>{roundLabel}</h2>
        </div>
        <span className="round-progress__number">
          {revealedCount}
          {" /"} {totalCount}
        </span>
      </PanelHeading>
      <StepProgress variant="console" value={progressPercent} total={100} />
    </section>
  );
}
`;export{e as default};