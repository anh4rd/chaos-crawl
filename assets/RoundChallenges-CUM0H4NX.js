var e=`import Badge from "../../../components/ui/Badge";
import Overline from "../../../components/ui/Overline";
import ControlRow from "../../../components/ui/ControlRow";
import ContentPanel from "../../../components/ui/ContentPanel";
import PanelGrid from "../../../components/ui/PanelGrid";
import Note from "../../../components/ui/Note";
import DisplayHeading from "../../../components/ui/DisplayHeading";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import type { Challenge, GameState } from "../../../types/database";
export interface RoundChallengesProps {
  game: GameState;
  currentRoundChallenges: Challenge[];
  currentChallengeIndex: number;
  nextRoundChallenge: Challenge | undefined;
  revealRoundChallenge: (challenge: Challenge) => Promise<void>;
}
export default function RoundChallenges({
  game,
  currentRoundChallenges,
  currentChallengeIndex,
  nextRoundChallenge,
  revealRoundChallenge,
}: RoundChallengesProps) {
  return (
    <Card className="round-challenges">
      <DisplayHeading variant="plain">Round Challenges</DisplayHeading>

      <Note variant="description">Reveal challenges throughout the round.</Note>

      {currentRoundChallenges.length === 0 ? (
        <Note variant="empty">No challenges assigned to this pub.</Note>
      ) : (
        <PanelGrid variant="feed-tight">
          {currentRoundChallenges.map((challenge, index) => {
            const isLive =
              String(game?.current_challenge_id) === String(challenge.id);
            const hasPassed =
              currentChallengeIndex >= 0 && index < currentChallengeIndex;
            const isNext = nextRoundChallenge?.id === challenge.id;
            return (
              <ContentPanel
                key={challenge.id}
                as="div"
                variant="round"
                state={isLive ? "live" : hasPassed ? "past" : "upcoming"}
              >
                <ControlRow variant="spread-start">
                  <div>
                    <Overline as="p" variant="plain-strong">
                      Challenge {index + 1}
                    </Overline>

                    <DisplayHeading
                      as="h3"
                      variant="plain-body"
                      className="round-challenges__title"
                    >
                      {challenge.title}
                    </DisplayHeading>

                    {challenge.description && (
                      <Note variant="body">{challenge.description}</Note>
                    )}

                    <Note variant="emphasis">
                      +{challenge.points ?? 0} points
                    </Note>
                  </div>

                  {isLive && <Badge variant="round-live">LIVE</Badge>}

                  {hasPassed && <Badge variant="round-passed">DONE</Badge>}

                  {isNext && !isLive && (
                    <Badge variant="round-next">NEXT</Badge>
                  )}
                </ControlRow>

                {!isLive && !hasPassed && (
                  <ControlRow variant="slot">
                    <Button
                      type="button"
                      onClick={() => revealRoundChallenge(challenge)}
                    >
                      Reveal Now
                    </Button>
                  </ControlRow>
                )}
              </ContentPanel>
            );
          })}
        </PanelGrid>
      )}

      {nextRoundChallenge && (
        <div className="round-challenges__next">
          <Button
            type="button"
            onClick={() => revealRoundChallenge(nextRoundChallenge)}
          >
            Reveal Next Challenge
          </Button>
        </div>
      )}
    </Card>
  );
}
`;export{e as default};