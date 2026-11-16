import QueryPanel from "../QueryPanel";
import Card from "../../../components/ui/Card";
import { usePlayers } from "../../../game/hooks/usePlayers";
import { useChallenges } from "../../../game/hooks/useChallenges";
import { useSideChallenges } from "../../../game/hooks/useSideChallenges";
import { useChallengeCompletions } from "../../../game/hooks/useChallengeCompletions";
export default function CompletionReviewTab() {
  const playersQuery = usePlayers();
  const { data: players } = playersQuery;
  const challengesQuery = useChallenges();
  const { data: challenges } = challengesQuery;
  const sideChallengesQuery = useSideChallenges();
  const { data: sideChallenges } = sideChallengesQuery;
  const completionsQuery = useChallengeCompletions();
  const { data: completions } = completionsQuery;
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
      {/* CHALLENGE REVIEW */}

      <Card>
        <h2 className="text-2xl font-bold">Challenge Review</h2>

        <p className="mt-2 text-sm text-zinc-400">
          Completion records and points linked to each challenge.
        </p>

        {completions.length === 0 ? (
          <p className="mt-4">No completions yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {completions.map((completion) => {
              const player = players.find(
                (item) => String(item.id) === String(completion.player_id),
              );

              const challenge =
                completion.challenge_type === "side"
                  ? sideChallenges.find(
                      (item) =>
                        String(item.id) === String(completion.challenge_id),
                    )
                  : challenges.find(
                      (item) =>
                        String(item.id) === String(completion.challenge_id),
                    );

              return (
                <div
                  key={completion.id}
                  className="rounded-xl border border-zinc-700 bg-black/50 p-4"
                >
                  <strong>{player?.name ?? "Unknown player"}</strong>

                  <p className="mt-1">
                    {challenge?.title ?? `Challenge ${completion.challenge_id}`}
                  </p>

                  <p className="mt-1 text-sm text-zinc-400">
                    {completion.challenge_type} • +{completion.points} points
                  </p>

                  {completion.photo_id != null && (
                    <p className="mt-2 text-sm text-pink-400">
                      📸 Media attached
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </QueryPanel>
  );
}
