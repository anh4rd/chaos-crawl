import StatTile from "../../components/ui/StatTile";
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
    <Card className="game-status">
      <p className="game-status__kicker">Now</p>

      <h2 className="game-status__title">{game.current_pub}</h2>

      <div className="game-status__statistics">
        <StatTile
          variant="legacy"
          label="Your team"
          value={currentPlayer.team ?? "Waiting..."}
        />
        <StatTile
          variant="legacy-score"
          label="Team score"
          value={teamScore ?? "—"}
        />
      </div>

      {game.scheduled_reveal_at && (
        <div className="game-status__scheduled">
          <p className="game-status__countdown">
            Next challenge in{" "}
            <ScheduledCountdown targetTime={game.scheduled_reveal_at} />
          </p>
        </div>
      )}
    </Card>
  );
}
