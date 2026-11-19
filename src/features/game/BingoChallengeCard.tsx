import ContentPanel from "../../components/ui/ContentPanel";
import type { SideChallenge } from "../../types/database";
import ChallengeActions, {
  type ChallengeParticipation,
} from "./ChallengeActions";

export default function BingoChallengeCard({
  challenge,
  participation,
}: {
  challenge: SideChallenge;
  participation: ChallengeParticipation;
}) {
  return (
    <ContentPanel as="div" variant="challenge" className="bingo-card">
      <div className="bingo-card__header">
        <div>
          <h3 className="bingo-card__title">{challenge.title}</h3>
          {challenge.description && (
            <p className="bingo-card__description">{challenge.description}</p>
          )}
        </div>
        <strong>+{challenge.points}</strong>
      </div>
      <ChallengeActions
        challenge={{
          id: challenge.id,
          title: challenge.title,
          points: challenge.points,
          type: "side",
        }}
        allowMedia={true}
        participation={participation}
      />
    </ContentPanel>
  );
}
