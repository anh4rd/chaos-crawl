import PageFrame from "../../components/ui/PageFrame";
import Card from "../../components/ui/Card";
import type { VoteResult } from "../../lib/voteResults";

export default function VoteResultsView({
  contentAs = "main",
  challenge,
  results,
}: {
  contentAs?: "main" | "div";
  challenge: string;
  results: VoteResult[];
}) {
  return (
    <PageFrame as={contentAs}>
      <Card>
        <h1 className="text-4xl font-bold">Voting Results</h1>

        <p className="mt-3">{challenge}</p>
      </Card>

      <ol className="space-y-3">
        {results.map((result, index) => (
          <li key={result.id}>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <span className="mr-3">{index === 0 ? "👑" : ""}</span>

                  <strong>{result.name}</strong>
                </div>

                <div className="text-2xl font-bold">{result.votes}</div>
              </div>
            </Card>
          </li>
        ))}
      </ol>
    </PageFrame>
  );
}
