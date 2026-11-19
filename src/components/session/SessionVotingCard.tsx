import Icon from "../ui/Icon";
import EvidenceGallery from "./EvidenceGallery";
import type { VotingEntry } from "./types";

export default function SessionVotingCard({
  entry,
  open,
  busy = false,
  onVote,
}: {
  entry: VotingEntry;
  open: boolean;
  busy?: boolean;
  onVote?: () => void;
}) {
  return (
    <article
      className={`session-voting-card${!open && entry.winner ? " session-voting-card--winner" : ""}`}
    >
      <EvidenceGallery items={[entry.media]} />
      <div className="session-voting-card__copy">
        <strong>{entry.participant.name}</strong>
        <p>{entry.challengeTitle}</p>
        {open && onVote ? (
          <button
            type="button"
            className="session-voting-card__vote"
            aria-pressed={entry.selected}
            disabled={busy}
            onClick={onVote}
          >
            <Icon name="heart" className="icon--size-16" aria-hidden="true" />
            {entry.selected ? "Your vote" : "Vote for this"}
          </button>
        ) : (
          <span>
            {entry.selected
              ? "Your vote"
              : open
                ? "Voting is open"
                : "Voting closed"}
          </span>
        )}
        {!open && entry.voteCount !== null && (
          <strong>{entry.voteCount} votes</strong>
        )}
        {!open && entry.winner && (
          <span className="session-voting-card__winner">Top submission</span>
        )}
        {!open && entry.voters && (
          <p aria-label={`Voters for ${entry.participant.name}'s submission`}>
            {entry.voters.length
              ? entry.voters.map((voter) => voter.name).join(", ")
              : "No voters"}
          </p>
        )}
      </div>
    </article>
  );
}
