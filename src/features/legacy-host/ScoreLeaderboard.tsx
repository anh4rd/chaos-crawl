import RankingRow from "../../components/ui/RankingRow";
import Button from "../../components/ui/Button";
import PanelGrid from "../../components/ui/PanelGrid";
import FilterGroup from "../../components/ui/FilterGroup";
import Note from "../../components/ui/Note";
import Overline from "../../components/ui/Overline";
import PanelHeading from "../../components/ui/PanelHeading";
import ContentPanel from "../../components/ui/ContentPanel";
import Icon from "../../components/ui/Icon";
import type { ScoreLeaderboardModel } from "./types";

export default function ScoreLeaderboard({
  target,
  loading,
  entries,
  onTargetChange,
}: ScoreLeaderboardModel) {
  return (
    <ContentPanel variant="console-white">
      <PanelHeading variant="console">
        <Overline variant="console">
          <Icon name="trophy" className="icon--size-14" /> LEADERBOARD
        </Overline>
        <Note variant="console-muted" as="span">
          {loading ? "Updating…" : "Live scores"}
        </Note>
      </PanelHeading>
      <FilterGroup variant="console" role="group" aria-label="Leaderboard view">
        <Button
          fullWidth={false}
          variant="console-segment"
          type="button"
          aria-pressed={target === "player"}
          className={target === "player" ? "btn--console-selected" : ""}
          onClick={() => onTargetChange("player")}
        >
          Player scores
        </Button>
        <Button
          fullWidth={false}
          variant="console-segment"
          type="button"
          aria-pressed={target === "team"}
          className={target === "team" ? "btn--console-selected" : ""}
          onClick={() => onTargetChange("team")}
        >
          Team scores
        </Button>
      </FilterGroup>
      {entries.length ? (
        <PanelGrid variant="console-ranking">
          {entries.map((entry, index) => (
            <RankingRow
              key={entry.id}
              rank={index + 1}
              name={entry.name}
              score={entry.score}
            />
          ))}
        </PanelGrid>
      ) : (
        <Note variant="console-empty">
          Scores will appear here when points are awarded.
        </Note>
      )}
    </ContentPanel>
  );
}
