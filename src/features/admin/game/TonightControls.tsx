import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import type { GameControls } from "./gameControlTypes";
import Input from "../../../components/ui/Input";
import { openVoting, closeVoting } from "../voting/votingControls";

export default function TonightControls({
  controls,
}: {
  controls: GameControls;
}) {
  const {
    game,
    nextRoundChallenge,
    revealRoundChallenge,
    nextPub,
    moveToNextPub,
    returnEveryoneToGame,
    scheduleMinutes,
    setScheduleMinutes,
    cancelScheduledReveal,
    currentRoundChallenges,
    scheduleChallenge,
    startSlideshow,
    stopSlideshow,
  } = controls;
  return (
    <>
      <Card>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink-400">
          Live right now
        </p>

        <h2 className="mt-2 text-3xl font-black">{game.current_pub}</h2>

        <p className="mt-3 text-lg font-bold">
          {game.current_challenge || "No live challenge"}
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3">
          {nextRoundChallenge && (
            <Button
              type="button"
              onClick={() => revealRoundChallenge(nextRoundChallenge)}
            >
              ⚡ Reveal Next Challenge
            </Button>
          )}

          <Button type="button" disabled={!nextPub} onClick={moveToNextPub}>
            📍 Move to Next Pub
          </Button>

          <Button type="button" onClick={returnEveryoneToGame}>
            ↩ Return Everyone to Game
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-2xl font-bold">Schedule a Reveal</h2>

        <p className="mt-2 text-sm text-zinc-400">
          Keep a game or host screen open and connected until reveal time.
          Background tabs may reveal late.
        </p>

        <label className="mt-4 block text-sm font-bold">
          Reveal in minutes
        </label>

        <Input
          value={scheduleMinutes}
          onChange={(event) => setScheduleMinutes(event.target.value)}
        />

        {game.scheduled_reveal_at && (
          <div className="mt-4 rounded-xl border border-yellow-500/60 bg-yellow-950/20 p-3">
            <p className="font-bold text-yellow-300">
              Scheduled for{" "}
              {new Date(game.scheduled_reveal_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>

            <Button type="button" onClick={cancelScheduledReveal}>
              Cancel Scheduled Reveal
            </Button>
          </div>
        )}

        <div className="mt-4 space-y-3">
          {currentRoundChallenges.map((challenge) => (
            <div
              key={challenge.id}
              className="rounded-xl border border-zinc-700 bg-black/50 p-4"
            >
              <strong>{challenge.title}</strong>

              <div className="mt-3">
                <Button
                  type="button"
                  onClick={() => scheduleChallenge(challenge)}
                >
                  ⏰ Schedule This
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-2xl font-bold">Emergency Controls</h2>

        <div className="mt-4 grid grid-cols-1 gap-3">
          {!game.slideshow_open ? (
            <Button type="button" onClick={startSlideshow}>
              📺 Start Slideshow
            </Button>
          ) : (
            <Button type="button" onClick={stopSlideshow}>
              ⛔ End Slideshow
            </Button>
          )}

          {!game.voting_open ? (
            <Button type="button" onClick={openVoting}>
              🗳️ Open Voting
            </Button>
          ) : (
            <Button type="button" onClick={closeVoting}>
              🏁 Close Voting & Show Results
            </Button>
          )}
        </div>
      </Card>
    </>
  );
}
