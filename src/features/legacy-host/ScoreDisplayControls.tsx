import Icon from "../../components/ui/Icon";
import type { ScoreDisplayControlsModel } from "./types";

export default function ScoreDisplayControls({
  showVoteResults,
  onOpenSlideshow,
  onReturnToGame,
}: ScoreDisplayControlsModel) {
  return (
    <section className="host-v2__panel host-v2__panel--tint">
      <div className="host-v2__panel-topline">
        <span className="host-v2__kicker">DISPLAY CONTROLS</span>
      </div>
      <button
        type="button"
        className="host-v2__button host-v2__button--primary"
        onClick={onOpenSlideshow}
      >
        Open slideshow <Icon name="chevron-right" className="icon--size-17" />
      </button>
      {showVoteResults && (
        <button
          type="button"
          className="host-v2__button host-v2__button--subtle"
          onClick={onReturnToGame}
        >
          Return everyone to game
        </button>
      )}
    </section>
  );
}
