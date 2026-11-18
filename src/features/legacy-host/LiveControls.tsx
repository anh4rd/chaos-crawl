import Icon from "../../components/ui/Icon";
import type { LiveControlsModel } from "./types";

export default function LiveControls({
  votingOpen,
  showResults,
  slideshowOpen,
  voteTarget,
  canOpenVoting,
  onCloseVoting,
  onViewResults,
  onReturnToGame,
  onVoteTargetChange,
  onOpenVoting,
  onToggleSlideshow,
}: LiveControlsModel) {
  return (
    <section className="host-v2__panel host-v2__panel--tint">
      <div className="host-v2__panel-topline">
        <span className="host-v2__kicker">
          <Icon name="users" className="icon--size-14" /> LIVE CONTROLS
        </span>
      </div>
      <div className="host-v2__actions host-v2__actions--stack">
        {votingOpen ? (
          <button
            type="button"
            className="host-v2__button host-v2__button--primary"
            onClick={onCloseVoting}
          >
            Close voting & show results{" "}
            <Icon name="trophy" className="icon--size-17" />
          </button>
        ) : showResults ? (
          <>
            <button
              type="button"
              className="host-v2__button host-v2__button--primary"
              onClick={onViewResults}
            >
              View vote results{" "}
              <Icon name="chevron-right" className="icon--size-17" />
            </button>
            <button
              type="button"
              className="host-v2__button host-v2__button--subtle"
              onClick={onReturnToGame}
            >
              Return everyone to game
            </button>
          </>
        ) : (
          <>
            <div className="host-v2__inline-selects">
              <label htmlFor="host-v2-vote-target">Vote for</label>
              <select
                id="host-v2-vote-target"
                value={voteTarget}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === "player" || value === "team")
                    onVoteTargetChange(value);
                }}
              >
                <option value="player">Players</option>
                <option value="team">Teams</option>
              </select>
            </div>
            <button
              type="button"
              className="host-v2__button host-v2__button--primary"
              disabled={!canOpenVoting}
              onClick={onOpenVoting}
            >
              {"Open voting"} <Icon name="trophy" className="icon--size-17" />
            </button>
          </>
        )}
        <button
          type="button"
          className="host-v2__button host-v2__button--subtle"
          onClick={onToggleSlideshow}
        >
          {slideshowOpen ? "Close slideshow" : "Open slideshow"}
          <Icon name="chevron-right" className="icon--size-17" />
        </button>
      </div>
    </section>
  );
}
