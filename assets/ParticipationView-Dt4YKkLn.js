var e=`import PanelGrid from "../../../components/ui/PanelGrid";
import NativeSelect from "../../../components/ui/NativeSelect";
import Note from "../../../components/ui/Note";
import DisplayHeading from "../../../components/ui/DisplayHeading";
import { useId, type ReactNode } from "react";
import Card from "../../../components/ui/Card";
export default function ParticipationView({
  gameAvailable,
  players,
  playerId,
  onPlayer,
  feedback,
  upload,
  children,
}: {
  gameAvailable: boolean;
  players: readonly {
    id: string;
    name: string;
    team: string | null;
  }[];
  playerId: string;
  onPlayer: (value: string) => void;
  feedback?: ReactNode;
  upload: ReactNode;
  children: ReactNode;
}) {
  const playerFieldId = useId();
  return (
    <>
      {gameAvailable ? (
        <>
          {feedback}
          {upload}
          <Card>
            <DisplayHeading variant="plain-compact">
              <label htmlFor={playerFieldId}>Play as a Player</label>
            </DisplayHeading>
            <Note variant="description">
              Choose your joined player account to take part as host.
            </Note>
            <NativeSelect
              id={playerFieldId}
              aria-label="Play as player"
              value={playerId}
              onChange={(event) => onPlayer(event.target.value)}
              spacing="wide"
            >
              <option value="">Select player</option>
              {players.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                  {candidate.team ? \` • \${candidate.team}\` : ""}
                </option>
              ))}
            </NativeSelect>
          </Card>
          <Card>
            <DisplayHeading variant="plain">Chaos Bingo</DisplayHeading>
            {!playerId ? (
              <Note variant="warning">Select a player above to take part.</Note>
            ) : (
              <PanelGrid variant="feed">{children}</PanelGrid>
            )}
          </Card>
        </>
      ) : (
        <p>Waiting for an active game...</p>
      )}
    </>
  );
}
`;export{e as default};