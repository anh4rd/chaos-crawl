var e=`import Button from "../../components/ui/Button";
import Overline from "../../components/ui/Overline";
import PanelHeading from "../../components/ui/PanelHeading";
import ContentPanel from "../../components/ui/ContentPanel";
import Icon from "../../components/ui/Icon";
import type { ScoreDisplayControlsModel } from "./types";

export default function ScoreDisplayControls({
  showVoteResults,
  onOpenSlideshow,
  onReturnToGame,
}: ScoreDisplayControlsModel) {
  return (
    <ContentPanel variant="console-tint">
      <PanelHeading variant="console">
        <Overline variant="console">DISPLAY CONTROLS</Overline>
      </PanelHeading>
      <Button
        type="button"
        fullWidth={false}
        variant="console-primary"
        onClick={onOpenSlideshow}
      >
        Open slideshow <Icon name="chevron-right" className="icon--size-17" />
      </Button>
      {showVoteResults && (
        <Button
          type="button"
          fullWidth={false}
          variant="console-subtle"
          onClick={onReturnToGame}
        >
          Return everyone to game
        </Button>
      )}
    </ContentPanel>
  );
}
`;export{e as default};