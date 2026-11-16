import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import type { Challenge, GameState, Pub } from "../../../types/database";

export interface LiveGameSelectionProps {
  game: GameState;
  selectedPub: string;
  setSelectedPub: (value: string) => void;
  pubs: Pub[];
  challenges: Challenge[];
  setSelectedChallenge: (value: string) => void;
  sortedPubs: Pub[];
  selectedChallenge: string;
  availableChallenges: Challenge[];
  goLive: () => Promise<void>;
  navigate: (path: string) => void;
}

export default function LiveGameSelection({
  game,
  selectedPub,
  setSelectedPub,
  pubs,
  challenges,
  setSelectedChallenge,
  sortedPubs,
  selectedChallenge,
  availableChallenges,
  goLive,
  navigate,
}: LiveGameSelectionProps) {
  const activeChallenge =
    challenges.find(
      (challenge) => String(challenge.id) === String(game.current_challenge_id),
    ) ??
    challenges.find((challenge) => challenge.title === game.current_challenge);
  return (
    <Card>
      <h2 className="text-xl font-bold">Change Live Game</h2>

      <label className="mt-4 block text-sm">Pub</label>

      <select
        value={selectedPub}
        onChange={(event) => {
          const pubName = event.target.value;

          setSelectedPub(pubName);

          const pub = pubs.find((item) => item.name === pubName);

          const first = challenges.find(
            (challenge) => String(challenge.pub_id) === String(pub?.id),
          );

          setSelectedChallenge(first?.title ?? "");
        }}
        className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white"
      >
        <option value="">Select pub</option>

        {sortedPubs.map((pub) => (
          <option key={pub.id} value={pub.name}>
            {pub.name}
          </option>
        ))}
      </select>

      <label className="mt-4 block text-sm">Challenge</label>

      <select
        value={selectedChallenge}
        onChange={(event) => setSelectedChallenge(event.target.value)}
        className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white"
      >
        <option value="">Select challenge</option>

        {availableChallenges.map((challenge) => (
          <option key={challenge.id} value={challenge.title}>
            {challenge.title}
          </option>
        ))}
      </select>

      <div className="mt-6">
        <Button type="button" onClick={goLive}>
          Go Live
        </Button>
        {activeChallenge && (
          <Button
            type="button"
            onClick={() =>
              navigate(
                `/challenge-review?type=main&id=${encodeURIComponent(
                  String(activeChallenge.id),
                )}&title=${encodeURIComponent(activeChallenge.title)}`,
              )
            }
          >
            Review & Award Points
          </Button>
        )}
      </div>
    </Card>
  );
}
