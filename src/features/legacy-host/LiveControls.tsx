import Button from "../../components/ui/Button";
import ControlRow from "../../components/ui/ControlRow";
import Overline from "../../components/ui/Overline";
import PanelHeading from "../../components/ui/PanelHeading";
import ContentPanel from "../../components/ui/ContentPanel";
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
    <ContentPanel variant="console-tint">
      <PanelHeading variant="console">
        <Overline variant="console">
          <Icon name="users" className="icon--size-14" /> LIVE CONTROLS
        </Overline>
      </PanelHeading>
      <ControlRow variant="console-actions-stack">
        {votingOpen ? (
          <Button
            type="button"
            fullWidth={false}
            variant="console-primary"
            onClick={onCloseVoting}
          >
            Close voting & show results{" "}
            <Icon name="trophy" className="icon--size-17" />
          </Button>
        ) : showResults ? (
          <>
            <Button
              type="button"
              fullWidth={false}
              variant="console-primary"
              onClick={onViewResults}
            >
              View vote results{" "}
              <Icon name="chevron-right" className="icon--size-17" />
            </Button>
            <Button
              type="button"
              fullWidth={false}
              variant="console-subtle"
              onClick={onReturnToGame}
            >
              Return everyone to game
            </Button>
          </>
        ) : (
          <>
            <div className="legacy-host__vote-target">
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
            <Button
              type="button"
              fullWidth={false}
              variant="console-primary"
              disabled={!canOpenVoting}
              onClick={onOpenVoting}
            >
              {"Open voting"} <Icon name="trophy" className="icon--size-17" />
            </Button>
          </>
        )}
        <Button
          type="button"
          fullWidth={false}
          variant="console-subtle"
          onClick={onToggleSlideshow}
        >
          {slideshowOpen ? "Close slideshow" : "Open slideshow"}
          <Icon name="chevron-right" className="icon--size-17" />
        </Button>
      </ControlRow>
    </ContentPanel>
  );
}
