import Card from "../../../components/ui/Card";
export interface CompletionReviewItem {
  id: string | number;
  playerName: string;
  challengeTitle: string;
  kind: string;
  points: number;
  hasMedia: boolean;
}
export default function CompletionReviewView({
  completions,
}: {
  completions: readonly CompletionReviewItem[];
}) {
  return (
    <Card>
      <h2 className="text-2xl font-bold">Challenge Review</h2>

      <p className="mt-2 text-sm text-zinc-400">
        Completion records and points linked to each challenge.
      </p>

      {completions.length === 0 ? (
        <p className="mt-4">No completions yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {completions.map((completion) => (
            <div
              key={completion.id}
              className="rounded-xl border border-zinc-700 bg-black/50 p-4"
            >
              <strong>{completion.playerName}</strong>

              <p className="mt-1">{completion.challengeTitle}</p>

              <p className="mt-1 text-sm text-zinc-400">
                {completion.kind} • +{completion.points} points
              </p>

              {completion.hasMedia && (
                <p className="mt-2 text-sm text-pink-400">📸 Media attached</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
