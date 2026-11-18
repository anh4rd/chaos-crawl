import ControlRow from "../../../components/ui/ControlRow";
import NativeSelect from "../../../components/ui/NativeSelect";
import FormLabel from "../../../components/ui/FormLabel";
import DisplayHeading from "../../../components/ui/DisplayHeading";
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
      <DisplayHeading variant="plain-compact">Change Live Game</DisplayHeading>

      <FormLabel variant="plain-spaced">Pub</FormLabel>

      <NativeSelect
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
        spacing="close"
      >
        <option value="">Select pub</option>

        {sortedPubs.map((pub) => (
          <option key={pub.id} value={pub.name}>
            {pub.name}
          </option>
        ))}
      </NativeSelect>

      <FormLabel variant="plain-spaced">Challenge</FormLabel>

      <NativeSelect
        value={selectedChallenge}
        onChange={(event) => setSelectedChallenge(event.target.value)}
        spacing="close"
      >
        <option value="">Select challenge</option>

        {availableChallenges.map((challenge) => (
          <option key={challenge.id} value={challenge.title}>
            {challenge.title}
          </option>
        ))}
      </NativeSelect>

      <ControlRow variant="slot-loose">
        <Button type="button" onClick={goLive}>
          Go Live
        </Button>
        {activeChallenge && (
          <Button
            type="button"
            onClick={() =>
              navigate(
                `/challenge-review?type=main&id=${encodeURIComponent(String(activeChallenge.id))}&title=${encodeURIComponent(activeChallenge.title)}`,
              )
            }
          >
            Review & Award Points
          </Button>
        )}
      </ControlRow>
    </Card>
  );
}
