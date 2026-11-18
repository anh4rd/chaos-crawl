import type { ChallengeType } from "../../types/database";
import SubmissionCardView, {
  type SubmissionCardViewProps,
} from "./SubmissionCardView";
import { useSubmissionAward } from "./useSubmissionAward";

export default function SubmissionCard({
  completion,
  player,
  media,
  challengeType,
  challengeId,
  challengeTitle,
}: Omit<SubmissionCardViewProps, "award"> & {
  challengeType: ChallengeType;
  challengeId: string;
  challengeTitle: string;
}) {
  const award = useSubmissionAward(
    player,
    challengeType,
    challengeId,
    challengeTitle,
  );
  return (
    <SubmissionCardView
      completion={completion}
      player={player}
      media={media}
      award={award}
    />
  );
}
