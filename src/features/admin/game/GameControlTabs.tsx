import RoundMovementControls from "./RoundMovementControls";
import { useGameControls } from "./useGameControls";
import QueryPanel from "../QueryPanel";
import RoundChallenges from "./RoundChallenges";
import LiveGameSelection from "./LiveGameSelection";
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
              <RoundMovementControls
                currentPub={game.current_pub}
                nextPubName={controls.nextPub?.name}
                canAdvance={Boolean(controls.nextPub)}
                onNext={controls.moveToNextPub}
              />
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
