var e=`import Overline from "../../components/ui/Overline";
import PageIntroduction from "../../components/ui/PageIntroduction";
import ScoreAdjustment from "./ScoreAdjustment";
import ScoreLeaderboard from "./ScoreLeaderboard";
import ScoreDisplayControls from "./ScoreDisplayControls";
import type {
  ScoreAdjustmentModel,
  ScoreLeaderboardModel,
  ScoreDisplayControlsModel,
} from "./types";

export default function ScoreOverview({
  adjustment,
  leaderboard,
  display,
}: {
  adjustment: ScoreAdjustmentModel;
  leaderboard: ScoreLeaderboardModel;
  display: ScoreDisplayControlsModel;
}) {
  return (
    <>
      <PageIntroduction>
        <Overline variant="console-eyebrow" as="p">
          COMPETITION
        </Overline>
        <h2>Scores & results</h2>
        <p>Award points, dock points and keep track of the leaderboard.</p>
      </PageIntroduction>
      <ScoreAdjustment {...adjustment} />
      <ScoreLeaderboard {...leaderboard} />
      <ScoreDisplayControls {...display} />
    </>
  );
}
`;export{e as default};