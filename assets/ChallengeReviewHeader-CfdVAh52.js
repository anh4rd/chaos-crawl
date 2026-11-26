var e=`import Card from "../../components/ui/Card";
import type { ChallengeType } from "../../types/database";

export default function ChallengeReviewHeader({
  challenge,
  error,
}: {
  challenge: { title: string; type: ChallengeType } | null;
  error: string;
}) {
  return (
    <Card className="review-heading">
      {challenge ? (
        <>
          <p className="review-heading__kicker">Challenge Review</p>
          <h1 className="review-heading__title">{challenge.title}</h1>
          <p className="review-heading__type">{challenge.type}</p>
        </>
      ) : (
        <>
          <h1 className="review-heading__title">Challenge not found</h1>
          <p className="review-heading__error">{error}</p>
        </>
      )}
    </Card>
  );
}
`;export{e as default};