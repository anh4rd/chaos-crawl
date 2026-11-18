import ChallengeListItem from "./ChallengeListItem";
import type { ChallengeRoundModel } from "./types";

export default function RoundChallengeList({
  round,
  busy,
}: {
  round: ChallengeRoundModel;
  busy: boolean;
}) {
  return (
    <section className="host-v2__panel host-v2__panel--white">
      <div className="host-v2__panel-topline">
        <span className="host-v2__kicker">{round.label.toUpperCase()}</span>
        <span className="host-v2__muted">
          {round.challenges.length} challenges
        </span>
      </div>
      <div className="host-v2__list">
        {round.challenges.map((challenge) => (
          <ChallengeListItem
            key={challenge.id}
            challenge={challenge}
            busy={busy}
          />
        ))}
      </div>
    </section>
  );
}
