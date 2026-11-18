import RoundChallengeList from "./RoundChallengeList";
import SideChallengeList from "./SideChallengeList";
import type { ChallengeRoundModel, SideChallengeItemModel } from "./types";

export default function ChallengeCatalogue({
  rounds,
  sideChallenges,
  busy,
}: {
  rounds: ChallengeRoundModel[];
  sideChallenges: SideChallengeItemModel[];
  busy: boolean;
}) {
  return (
    <>
      <div className="host-v2__page-intro">
        <p className="host-v2__eyebrow">GAME CONTENT</p>
        <h2>Challenges</h2>
        <p>
          Rounds happen here at the venue. Reveal or schedule a challenge
          whenever you're ready.
        </p>
      </div>
      {rounds.map((round) => (
        <RoundChallengeList key={round.id} round={round} busy={busy} />
      ))}
      <SideChallengeList challenges={sideChallenges} />
    </>
  );
}
