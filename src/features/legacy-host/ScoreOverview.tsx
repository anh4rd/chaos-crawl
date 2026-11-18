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
      <div className="host-v2__page-intro">
        <p className="host-v2__eyebrow">COMPETITION</p>
        <h2>Scores & results</h2>
        <p>Award points, dock points and keep track of the leaderboard.</p>
      </div>
      <ScoreAdjustment {...adjustment} />
      <ScoreLeaderboard {...leaderboard} />
      <ScoreDisplayControls {...display} />
    </>
  );
}
