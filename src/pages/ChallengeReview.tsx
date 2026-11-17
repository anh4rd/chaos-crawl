import { useNavigate, useSearchParams } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import ChallengeReviewContent from "../features/review/ChallengeReviewContent";
import type { ChallengeType } from "../types/database";

function parseChallengeType(value: string): ChallengeType | null {
  return value === "main" || value === "side" || value === "bonus"
    ? value
    : null;
}

export default function ChallengeReview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const challengeType = parseChallengeType(searchParams.get("type") ?? "main");
  const challengeId = searchParams.get("id")?.trim() ?? "";
  const challengeTitle = searchParams.get("title") ?? "Challenge";
  const validChallenge = challengeType !== null && challengeId !== "";

  return (
    <main className="mx-auto min-h-screen max-w-md space-y-6 p-6">
      <Card>
        {validChallenge ? (
          <>
            <p className="text-sm uppercase">Challenge Review</p>
            <h1 className="mt-2 text-3xl font-bold">{challengeTitle}</h1>
            <p className="mt-2 text-sm">{challengeType}</p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold">Challenge not found</h1>
            <p className="mt-3">
              {!challengeType
                ? "Choose a main, side or bonus challenge to review."
                : "No challenge ID was provided."}
            </p>
          </>
        )}
      </Card>
      {validChallenge && (
        <ChallengeReviewContent
          key={JSON.stringify([challengeType, challengeId])}
          challengeType={challengeType}
          challengeId={challengeId}
          challengeTitle={challengeTitle}
        />
      )}
      <Button type="button" onClick={() => navigate("/admin")}>
        Back to Admin
      </Button>
    </main>
  );
}
