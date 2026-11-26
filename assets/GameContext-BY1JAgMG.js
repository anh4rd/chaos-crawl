var e=`import GameOverview from "./GameOverview";
import SetupProgress from "./SetupProgress";
import HintCard from "../../components/ui/HintCard";
import type { HostGame } from "../../types/hostHub";
export default function GameContext({
  dashboardGame,
  readOnly,
  onEdit,
  onPlay,
  onCreate,
}: {
  dashboardGame: HostGame | null;
  readOnly: boolean;
  onEdit: (id: string) => void;
  onPlay: (game: HostGame) => void;
  onCreate: () => void;
}) {
  return (
    <div className="game-context">
      <GameOverview
        dashboardGame={dashboardGame}
        readOnly={readOnly}
        onEdit={onEdit}
      />
      <SetupProgress
        dashboardGame={dashboardGame}
        readOnly={readOnly}
        onEdit={onEdit}
        onPlay={onPlay}
        onCreate={onCreate}
      />
      <HintCard icon="sparkles">
        <strong>Make it yours.</strong> Edit a plan any time before the game
        starts.
      </HintCard>
    </div>
  );
}
`;export{e as default};