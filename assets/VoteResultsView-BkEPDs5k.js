var e=`import PageFrame from "../../components/ui/PageFrame";
import ScreenIntro from "../../components/ui/ScreenIntro";
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
      <ScreenIntro title="Voting Results" description={challenge} />

      <ol className="vote-results__list">
        {results.map((result, index) => (
          <li key={result.id}>
            <Card>
              <div className="vote-results__row">
                <div>
                  <span className="vote-results__rank">
                    {index === 0 ? "👑" : ""}
                  </span>

                  <strong>{result.name}</strong>
                </div>

                <div className="vote-results__total">{result.votes}</div>
              </div>
            </Card>
          </li>
        ))}
      </ol>
    </PageFrame>
  );
}
`;export{e as default};