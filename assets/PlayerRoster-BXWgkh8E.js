var e=`import { useRosterFocus } from "./useRosterFocus";
import PanelGrid from "../../components/ui/PanelGrid";
import Button from "../../components/ui/Button";
import ControlRow from "../../components/ui/ControlRow";
import Note from "../../components/ui/Note";
import Overline from "../../components/ui/Overline";
import PanelHeading from "../../components/ui/PanelHeading";
import ContentPanel from "../../components/ui/ContentPanel";
import PlayerRow from "./PlayerRow";
import Icon from "../../components/ui/Icon";
import type { PlayerRosterModel } from "./types";
export default function PlayerRoster({
  players,
  teams,
  draft,
  creating,
  canCreate,
  onDraftChange,
  onCreate,
}: PlayerRosterModel) {
  const focus = useRosterFocus(players);
  return (
    <ContentPanel
      variant="console-white"
      onFocusCapture={focus.onFocusCapture}
      onBlurCapture={focus.onBlurCapture}
    >
      <PanelHeading variant="console">
        <Overline variant="console">
          <Icon name="users" className="icon--size-14" /> PLAYER ROSTER
        </Overline>
        <Note variant="console-muted" as="span">
          {players.length} players
        </Note>
      </PanelHeading>
      <ControlRow variant="console-add">
        <input
          ref={focus.newPlayer}
          aria-label="New player name"
          placeholder="Add a player"
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
        />
        <Button
          type="button"
          fullWidth={false}
          variant="console-square"
          aria-label="Add player"
          disabled={!canCreate}
          onClick={onCreate}
        >
          {creating ? "…" : <Icon name="plus" className="icon--size-18" />}
        </Button>
      </ControlRow>
      {players.length ? (
        <PanelGrid variant="console-roster">
          {players.map((player) => (
            <PlayerRow key={player.id} player={player} teams={teams} />
          ))}
        </PanelGrid>
      ) : (
        <Note variant="console-empty">
          Players will appear here when they join using your game code.
        </Note>
      )}
    </ContentPanel>
  );
}
`;export{e as default};