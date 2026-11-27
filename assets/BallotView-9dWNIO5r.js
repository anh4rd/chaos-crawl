var e=`import ChoiceOption from "../../components/ui/ChoiceOption";
import PageFrame from "../../components/ui/PageFrame";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import type { Player, Team } from "../../types/database";

export interface BallotViewProps {
  contentAs?: "main" | "div";
  challenge: string;
  target: "player" | "team";
  players: Player[];
  teams: Team[];
  fromAdmin: boolean;
  selection: string | null;
  setSelection: (value: string) => void;
  onRejoin: () => void;
  onBack: () => void;
  ballot: {
    sessionInvalid: boolean;
    hasVoted: boolean | null;
    submitting: boolean;
    error: Error | null;
    cast: (selection: string | null) => Promise<void>;
    reload: () => Promise<void>;
  };
}

export default function BallotView({
  contentAs = "main",
  challenge,
  target,
  players,
  teams,
  fromAdmin,
  selection,
  setSelection,
  onRejoin,
  onBack,
  ballot,
}: BallotViewProps) {
  const options =
    target === "team"
      ? teams.map((team) => ({ ...team, description: "" }))
      : players.map((player) => ({
          ...player,
          description: player.team ?? "Unassigned",
        }));
  return (
    <PageFrame as={contentAs} className="ballot">
      {ballot.sessionInvalid ? (
        <Card>
          <h1 className="ballot__title">Rejoin Needed</h1>
          <p className="ballot__copy">
            Your saved player session no longer matches a player in the game.
          </p>
          <Button
            type="button"
            onClick={() => {
              onRejoin();
            }}
          >
            Rejoin Game
          </Button>
        </Card>
      ) : ballot.hasVoted ? (
        <Card>
          <h1 className="ballot__title">Vote Cast!</h1>
          <p className="ballot__copy">
            Your vote for {challenge} is locked in.
          </p>
          <p className="ballot__waiting">
            Waiting for the host to close voting...
          </p>
        </Card>
      ) : (
        <>
          <header className="ballot__header">
            <h1 className="ballot__title">Vote!</h1>
            <p className="ballot__challenge">{challenge}</p>
            <p className="ballot__instructions">Choose the winning {target}.</p>
          </header>
          {ballot.hasVoted === null ? (
            <p>Checking your vote...</p>
          ) : (
            <>
              <div className="ballot__options">
                {options.map((option) => (
                  <ChoiceOption
                    key={option.id}
                    variant="ballot"
                    label={option.name}
                    description={option.description}
                    imageSrc={option.avatar_url}
                    selected={selection === option.id}
                    aria-pressed={selection === option.id}
                    disabled={ballot.submitting}
                    onClick={() => setSelection(option.id)}
                  />
                ))}
              </div>
              <Button
                type="button"
                onClick={() => {
                  void ballot.cast(selection);
                }}
                disabled={ballot.submitting}
              >
                {ballot.submitting ? "Submitting..." : "Cast Vote"}
              </Button>
            </>
          )}
        </>
      )}
      {ballot.error && (
        <div>
          <p role="alert">{ballot.error.message}</p>
          {ballot.hasVoted === null && (
            <Button
              type="button"
              onClick={() => {
                void ballot.reload();
              }}
            >
              Try again
            </Button>
          )}
        </div>
      )}
      {fromAdmin && (
        <Button type="button" onClick={onBack}>
          Back to Host Control
        </Button>
      )}
    </PageFrame>
  );
}
`;export{e as default};