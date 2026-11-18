import { useGameControls } from "./useGameControls";
import QueryPanel from "../QueryPanel";
import RoundChallenges from "./RoundChallenges";
import LiveGameSelection from "./LiveGameSelection";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
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
            <>
              <RoundChallenges
                game={game}
                currentRoundChallenges={controls.currentRoundChallenges}
                currentChallengeIndex={controls.currentChallengeIndex}
                nextRoundChallenge={controls.nextRoundChallenge}
                revealRoundChallenge={controls.revealRoundChallenge}
              />
              <Card>
                <h2 className="text-xl font-bold">Move Round</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Current pub: <strong>{game.current_pub}</strong>
                </p>
                <p className="mt-2 text-sm text-zinc-400">
                  Next pub: <strong>{controls.nextPub?.name ?? "None"}</strong>
                </p>
                <div className="mt-4">
                  <Button
                    type="button"
                    disabled={!controls.nextPub}
                    onClick={controls.moveToNextPub}
                  >
                    Move to Next Pub
                  </Button>
                </div>
              </Card>
              <LiveGameSelection
                game={game}
                selectedPub={controls.selectedPub}
                setSelectedPub={controls.setSelectedPub}
                pubs={controls.pubs}
                challenges={controls.challenges}
                setSelectedChallenge={controls.setSelectedChallenge}
                sortedPubs={controls.sortedPubs}
                selectedChallenge={controls.selectedChallenge}
                availableChallenges={controls.availableChallenges}
                goLive={controls.goLive}
                navigate={controls.navigate}
              />
            </>
          )}
          {activeTab === "tonight" && (
            <TonightControls
              game={game}
              openVoting={controls.openVoting}
              closeVoting={controls.closeVoting}
              nextRoundChallenge={controls.nextRoundChallenge}
              revealRoundChallenge={controls.revealRoundChallenge}
              nextPub={controls.nextPub}
              moveToNextPub={controls.moveToNextPub}
              returnEveryoneToGame={controls.returnEveryoneToGame}
              scheduleMinutes={controls.scheduleMinutes}
              setScheduleMinutes={controls.setScheduleMinutes}
              cancelScheduledReveal={controls.cancelScheduledReveal}
              currentRoundChallenges={controls.currentRoundChallenges}
              scheduleChallenge={controls.scheduleChallenge}
              startSlideshow={controls.startSlideshow}
              stopSlideshow={controls.stopSlideshow}
            />
          )}
          {activeTab === "screens" && (
            <ScreenControls
              game={game}
              navigate={controls.navigate}
              startSlideshow={controls.startSlideshow}
              stopSlideshow={controls.stopSlideshow}
            />
          )}
        </>
      ) : (
        <p>No live game is available yet.</p>
      )}
    </QueryPanel>
  );
}
