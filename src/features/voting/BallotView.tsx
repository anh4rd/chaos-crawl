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
    <PageFrame as={contentAs}>
      {ballot.sessionInvalid ? (
        <Card>
          <h1 className="text-4xl font-bold">Rejoin Needed</h1>
          <p className="mt-4">
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
          <h1 className="text-4xl font-bold">Vote Cast!</h1>
          <p className="mt-4">Your vote for {challenge} is locked in.</p>
          <p className="mt-4 text-sm text-zinc-400">
            Waiting for the host to close voting...
          </p>
        </Card>
      ) : (
        <>
          <header className="text-center">
            <h1 className="text-4xl font-bold">Vote!</h1>
            <p className="mt-2">{challenge}</p>
            <p className="mt-2 text-sm">Choose the winning {target}.</p>
          </header>
          {ballot.hasVoted === null ? (
            <p>Checking your vote...</p>
          ) : (
            <>
              <div className="space-y-3">
                {options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selection === option.id}
                    disabled={ballot.submitting}
                    onClick={() => setSelection(option.id)}
                    className={`w-full rounded-2xl border-4 p-4 text-left ${selection === option.id ? "border-yellow-400 bg-pink-500" : "border-pink-500 bg-black/80"}`}
                  >
                    <div className="text-xl font-bold">{option.name}</div>
                    {option.description && (
                      <div className="text-sm">{option.description}</div>
                    )}
                  </button>
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
