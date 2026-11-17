import Card from "../../components/ui/Card";
import type { GameState, Player } from "../../types/database";
import ScheduledCountdown from "../ScheduledCountdown";

export function GameStatus({
  game,
  currentPlayer,
  teamScore,
}: {
  game: GameState;
  currentPlayer: Player;
  teamScore: number | null;
}) {
  return (
    <Card>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink-400">
        Now
      </p>

      <h2 className="mt-2 text-4xl font-black leading-none">
        {game.current_pub}
      </h2>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-zinc-900 p-3">
          <p className="text-xs uppercase text-zinc-400">Your team</p>

          <p className="mt-1 font-bold">
            {currentPlayer?.team ?? "Waiting..."}
          </p>
        </div>

        <div className="rounded-2xl bg-zinc-900 p-3">
          <p className="text-xs uppercase text-zinc-400">Team score</p>

          <p className="mt-1 text-2xl font-black text-yellow-400">
            {teamScore ?? "—"}
          </p>
        </div>
      </div>

      {game.scheduled_reveal_at && (
        <div className="mt-3 rounded-2xl border border-pink-500/60 bg-pink-950/30 p-3">
          <p className="text-xs font-bold uppercase text-pink-300">
            Next challenge in{" "}
            <ScheduledCountdown targetTime={game.scheduled_reveal_at} />
          </p>
        </div>
      )}
    </Card>
  );
}
