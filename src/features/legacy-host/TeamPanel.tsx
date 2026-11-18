import Badge from "../../components/ui/Badge";
import TagList from "../../components/ui/TagList";
import Button from "../../components/ui/Button";
import ControlRow from "../../components/ui/ControlRow";
import Note from "../../components/ui/Note";
import Overline from "../../components/ui/Overline";
import PanelHeading from "../../components/ui/PanelHeading";
import ContentPanel from "../../components/ui/ContentPanel";
import Icon from "../../components/ui/Icon";
import type { TeamPanelModel } from "./types";

export default function TeamPanel({
  teamCount,
  names,
  loading: teamsLoading,
  draft,
  creating,
  canCreate,
  onDraftChange,
  onCreate,
}: TeamPanelModel) {
  return (
    <ContentPanel variant="console-white">
      <PanelHeading variant="console">
        <Overline variant="console">
          <Icon name="users" className="icon--size-14" /> TEAMS
        </Overline>
        <Note variant="console-muted" as="span">
          {teamCount} teams
        </Note>
      </PanelHeading>
      <ControlRow variant="console-add">
        <input
          aria-label="New team name"
          placeholder="New team name"
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
        />
        <Button
          type="button"
          fullWidth={false}
          variant="console-square"
          aria-label="Create team"
          disabled={!canCreate}
          onClick={onCreate}
        >
          {creating ? "…" : <Icon name="plus" className="icon--size-18" />}
        </Button>
      </ControlRow>
      {teamsLoading ? (
        <Note variant="console-muted">Loading teams…</Note>
      ) : names.length ? (
        <TagList variant="console">
          {names.map((name) => (
            <Badge variant="console-team" key={name}>
              {name}
            </Badge>
          ))}
        </TagList>
      ) : (
        <Note variant="console-empty">
          Create a team or assign players to a team below.
        </Note>
      )}
    </ContentPanel>
  );
}
