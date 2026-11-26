var e=`import Overline from "../../components/ui/Overline";
import PageIntroduction from "../../components/ui/PageIntroduction";
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
      <PageIntroduction>
        <Overline variant="console-eyebrow" as="p">
          GAME CONTENT
        </Overline>
        <h2>Challenges</h2>
        <p>
          Rounds happen here at the venue. Reveal or schedule a challenge
          whenever you're ready.
        </p>
      </PageIntroduction>
      {rounds.map((round) => (
        <RoundChallengeList key={round.id} round={round} busy={busy} />
      ))}
      <SideChallengeList challenges={sideChallenges} />
    </>
  );
}
`;export{e as default};