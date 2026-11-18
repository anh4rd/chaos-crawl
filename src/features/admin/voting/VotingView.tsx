import ContentPanel from "../../../components/ui/ContentPanel";
import PanelGrid from "../../../components/ui/PanelGrid";
import NativeSelect from "../../../components/ui/NativeSelect";
import Note from "../../../components/ui/Note";
import DisplayHeading from "../../../components/ui/DisplayHeading";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
export default function VotingView({
  game,
  liveResults,
  onTarget,
  onOpenVoting,
  onCloseVoting,
  onCloseResults,
  onNavigate,
}: {
  game: {
    current_challenge: string;
    voting_target: "player" | "team" | null;
    voting_open: boolean;
    show_vote_results: boolean;
  } | null;
  liveResults: readonly {
    id: string;
    name: string;
    votes: number;
  }[];
  onTarget: (value: string) => Promise<void>;
  onOpenVoting: () => Promise<void>;
  onCloseVoting: () => Promise<void>;
  onCloseResults: () => Promise<void>;
  onNavigate: (path: string) => void;
}) {
  return (
    <>
      {game ? (
        <>
          <Card>
            <DisplayHeading variant="plain-compact">Voting</DisplayHeading>

            <Note variant="description">
              Current challenge: {game.current_challenge}
            </Note>

            <NativeSelect
              value={game.voting_target ?? "player"}
              onChange={(event) => onTarget(event.target.value)}
              spacing="wide"
            >
              <option value="player">Vote for Player</option>

              <option value="team">Vote for Team</option>
            </NativeSelect>

            <PanelGrid variant="feed-tight">
              {!game.voting_open && !game.show_vote_results && (
                <Button type="button" onClick={onOpenVoting}>
                  Open Voting
                </Button>
              )}

              {game.voting_open && (
                <>
                  <Button
                    type="button"
                    onClick={() => onNavigate("/vote?from=admin")}
                  >
                    🗳️ Vote Now
                  </Button>

                  <Button type="button" onClick={onCloseVoting}>
                    Close Voting & Show Results
                  </Button>
                </>
              )}

              {game.show_vote_results && (
                <>
                  <Button
                    type="button"
                    onClick={() => onNavigate("/vote-results")}
                  >
                    View Results
                  </Button>

                  <Button type="button" onClick={onCloseResults}>
                    Close Results & Return Everyone
                  </Button>
                </>
              )}
            </PanelGrid>
          </Card>

          <Card>
            <DisplayHeading variant="plain-compact">
              Live Voting Results
            </DisplayHeading>

            <Note variant="body">{game.current_challenge}</Note>

            {liveResults.length === 0 ? (
              <Note variant="empty-muted">No votes yet.</Note>
            ) : (
              <PanelGrid variant="feed-tight">
                {liveResults.map((result, index) => (
                  <ContentPanel key={result.id} as="div" variant="ranking">
                    <strong>
                      {index === 0 ? "👑 " : ""}

                      {result.name}
                    </strong>

                    <Note as="span" variant="total">
                      {result.votes}
                    </Note>
                  </ContentPanel>
                ))}
              </PanelGrid>
            )}
          </Card>
        </>
      ) : (
        <p>No live game is available yet.</p>
      )}
    </>
  );
}
