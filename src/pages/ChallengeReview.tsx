import PageFrame from "../components/ui/PageFrame";
import { useNavigate, useSearchParams } from "react-router-dom";
import ChallengeReviewHeader from "../features/review/ChallengeReviewHeader";
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
    <PageFrame>
      <ChallengeReviewHeader
        challenge={
          validChallenge ? { title: challengeTitle, type: challengeType } : null
        }
        error={
          !challengeType
            ? "Choose a main, side or bonus challenge to review."
            : "No challenge ID was provided."
        }
      />
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
    </PageFrame>
  );
}
