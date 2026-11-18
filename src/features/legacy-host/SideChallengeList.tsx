import SideChallengeItem from "./SideChallengeItem";
import type { SideChallengeItemModel } from "./types";

export default function SideChallengeList({
  challenges,
}: {
  challenges: SideChallengeItemModel[];
}) {
  return (
    <section className="host-v2__panel host-v2__panel--tint">
      <div className="host-v2__section-heading">
        <div>
          <p className="host-v2__eyebrow">OPTIONAL TASKS</p>
          <h2>Side challenges</h2>
        </div>
        <span className="host-v2__count-pill">{challenges.length}</span>
      </div>
      <p className="host-v2__body-copy">
        These can be completed at any point during the party.
      </p>
      {challenges.length ? (
        <div className="host-v2__list">
          {challenges.map((challenge) => (
            <SideChallengeItem key={challenge.id} challenge={challenge} />
          ))}
        </div>
      ) : (
        <p className="host-v2__empty-copy">No active side challenges found.</p>
      )}
    </section>
  );
}
