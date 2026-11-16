import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import type { GameControls } from "./gameControlTypes";
import RoundChallenges from "./RoundChallenges";
import LiveGameSelection from "./LiveGameSelection";
export default function LiveGameControls({
  controls,
}: {
  controls: GameControls;
}) {
  const { game, nextPub, moveToNextPub } = controls;
  return (
    <>
      <RoundChallenges controls={controls} />
      <Card>
        <h2 className="text-xl font-bold">Move Round</h2>

        <p className="mt-2 text-sm text-zinc-400">
          Current pub: <strong>{game.current_pub}</strong>
        </p>

        <p className="mt-2 text-sm text-zinc-400">
          Next pub: <strong>{nextPub?.name ?? "None"}</strong>
        </p>

        <div className="mt-4">
          <Button type="button" disabled={!nextPub} onClick={moveToNextPub}>
            Move to Next Pub
          </Button>
        </div>
      </Card>
      <LiveGameSelection controls={controls} />
    </>
  );
}
