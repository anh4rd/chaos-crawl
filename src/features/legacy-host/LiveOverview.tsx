import RoundProgress from "./RoundProgress";
import CurrentChallenge from "./CurrentChallenge";
import UpcomingChallenge from "./UpcomingChallenge";
import LiveControls from "./LiveControls";
import type {
  RoundProgressModel,
  CurrentChallengeModel,
  UpcomingChallengeModel,
  LiveControlsModel,
} from "./types";
export default function LiveOverview({
  progress,
  current,
  upcoming,
  controls,
}: {
  progress: RoundProgressModel;
  current: CurrentChallengeModel;
  upcoming: UpcomingChallengeModel;
  controls: LiveControlsModel;
}) {
  return (
    <>
      <RoundProgress {...progress} />
      <CurrentChallenge {...current} />
      <UpcomingChallenge {...upcoming} />
      <LiveControls {...controls} />
    </>
  );
}
