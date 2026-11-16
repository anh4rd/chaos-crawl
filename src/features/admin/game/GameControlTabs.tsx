import { useGameControls } from "./useGameControls";
import QueryPanel from "../QueryPanel";
import LiveGameControls from "./LiveGameControls";
import TonightControls from "./TonightControls";
import ScreenControls from "./ScreenControls";

export default function GameControlTabs({
  activeTab,
}: {
  activeTab: "live" | "tonight" | "screens";
}) {
  const controls = useGameControls();
  const game = controls.game;
  return (
    <QueryPanel
      queries={controls.queries}
      loadingText="Loading host control..."
    >
      {game ? (
        <>
          {activeTab === "live" && (
            <LiveGameControls controls={{ ...controls, game }} />
          )}
          {activeTab === "tonight" && (
            <TonightControls controls={{ ...controls, game }} />
          )}
          {activeTab === "screens" && (
            <ScreenControls controls={{ ...controls, game }} />
          )}
        </>
      ) : (
        <p>No live game is available yet.</p>
      )}
    </QueryPanel>
  );
}
