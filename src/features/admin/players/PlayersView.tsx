import ControlRow from "../../../components/ui/ControlRow";
import Note from "../../../components/ui/Note";
import ContentPanel from "../../../components/ui/ContentPanel";
import PanelGrid from "../../../components/ui/PanelGrid";
import DisplayHeading from "../../../components/ui/DisplayHeading";
import type { ReactNode } from "react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
export interface ManagedPlayer {
  id: string;
  name: string;
  team: string | null;
  score: number;
}
export default function PlayersView({
  players,
  savingPlayerId,
  onChangePoints,
  onRemove,
  renderNameEditor,
}: {
  players: readonly ManagedPlayer[];
  savingPlayerId: string | null;
  onChangePoints: (id: string, amount: number) => Promise<void>;
  onRemove: (id: string, name: string) => Promise<void>;
  renderNameEditor: (player: ManagedPlayer) => ReactNode;
}) {
  return (
    <>
      <Card>
        <DisplayHeading variant="plain">Players</DisplayHeading>

        <PanelGrid variant="feed">
          {players.map((player) => (
            <ContentPanel key={player.id} as="div" variant="ledger">
              {renderNameEditor(player)}

              <Note variant="help">Team: {player.team ?? "Unassigned"}</Note>

              <Note variant="status">Score: {player.score}</Note>

              <ControlRow variant="score-actions">
                <Button
                  type="button"
                  disabled={savingPlayerId !== null}
                  onClick={() => onChangePoints(player.id, 5)}
                >
                  +5
                </Button>

                <Button
                  type="button"
                  disabled={savingPlayerId !== null}
                  onClick={() => onChangePoints(player.id, 10)}
                >
                  +10
                </Button>

                <Button
                  type="button"
                  disabled={savingPlayerId !== null}
                  onClick={() => onChangePoints(player.id, -5)}
                >
                  -5
                </Button>
              </ControlRow>

              <ControlRow variant="slot-tight">
                <Button
                  type="button"
                  onClick={() => onRemove(player.id, player.name)}
                >
                  Delete Player
                </Button>
              </ControlRow>
            </ContentPanel>
          ))}
        </PanelGrid>
      </Card>
    </>
  );
}
