var e=`import QueryPanel from "../QueryPanel";
import { usePlayers } from "../../../game/hooks/usePlayers";
import { useChallenges } from "../../../game/hooks/useChallenges";
import { useSideChallenges } from "../../../game/hooks/useSideChallenges";
import { useChallengeCompletions } from "../../../game/hooks/useChallengeCompletions";
import CompletionReviewView from "./CompletionReviewView";
export default function CompletionReviewTab() {
  const playersQuery = usePlayers();
  const { data: players } = playersQuery;
  const challengesQuery = useChallenges();
  const { data: challenges } = challengesQuery;
  const sideChallengesQuery = useSideChallenges();
  const { data: sideChallenges } = sideChallengesQuery;
  const completionsQuery = useChallengeCompletions();
  const { data: completions } = completionsQuery;
  const items = completions.map((completion) => {
    const player = players.find(
      (item) => String(item.id) === String(completion.player_id),
    );
    const challenge =
      completion.challenge_type === "side"
        ? sideChallenges.find(
            (item) => String(item.id) === String(completion.challenge_id),
          )
        : challenges.find(
            (item) => String(item.id) === String(completion.challenge_id),
          );
    return {
      id: completion.id,
      playerName: player?.name ?? "Unknown player",
      challengeTitle:
        challenge?.title ?? \`Challenge \${completion.challenge_id}\`,
      kind: completion.challenge_type,
      points: completion.points,
      hasMedia: completion.photo_id != null,
    };
  });
  return (
    <QueryPanel
      queries={[
        playersQuery,
        challengesQuery,
        sideChallengesQuery,
        completionsQuery,
      ]}
      loadingText="Loading completions..."
    >
      <CompletionReviewView completions={items} />
    </QueryPanel>
  );
}
`;export{e as default};