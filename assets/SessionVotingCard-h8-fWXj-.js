var e=`import Icon from "../ui/Icon";
import Avatar from "../ui/Avatar";
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
      className={\`session-voting-card\${!open && entry.winner ? " session-voting-card--winner" : ""}\`}
    >
      <EvidenceGallery items={[entry.media]} />
      <div className="session-voting-card__copy">
        <div className="session-voting-card__participant">
          {entry.participant.avatarUrl && (
            <Avatar
              name={entry.participant.name}
              imageSrc={entry.participant.avatarUrl}
              variant="compact"
            />
          )}
          <strong>{entry.participant.name}</strong>
        </div>
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
          <p aria-label={\`Voters for \${entry.participant.name}'s submission\`}>
            {entry.voters.length
              ? entry.voters.map((voter, index) => (
                  <span key={voter.id}>
                    {index > 0 && ", "}
                    <span className="session-voting-card__voter">
                      {voter.avatarUrl && (
                        <Avatar
                          name={voter.name}
                          imageSrc={voter.avatarUrl}
                          variant="compact"
                        />
                      )}
                      {voter.name}
                    </span>
                  </span>
                ))
              : "No voters"}
          </p>
        )}
      </div>
    </article>
  );
}
`;export{e as default};