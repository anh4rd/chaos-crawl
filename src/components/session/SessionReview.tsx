import EvidenceGallery from "./EvidenceGallery";
import SessionLeaderboard from "./SessionLeaderboard";
import type { EvidencePresentation, RankedParticipant } from "./types";
import Avatar from "../ui/Avatar";
export default function SessionReview({
  title,
  description,
  owner,
  ownerAvatarUrl,
  points,
  evidence,
  open,
  vote,
  outcome,
  votesCast,
  successVotes,
  failVotes,
  busy = false,
  onVote,
  voters,
  leaderboard,
  viewerId,
}: {
  title: string;
  description: string;
  owner: string;
  ownerAvatarUrl?: string | null;
  points: number;
  evidence: EvidencePresentation[];
  open: boolean;
  vote?: "success" | "fail" | null;
  outcome?: "success" | "fail" | null;
  votesCast: number;
  successVotes: number | null;
  failVotes: number | null;
  busy?: boolean;
  onVote?: (vote: "success" | "fail") => void;
  voters: {
    id: string;
    name: string;
    vote: "success" | "fail";
    avatarUrl?: string | null;
  }[];
  leaderboard: RankedParticipant[];
  viewerId?: string | null;
}) {
  return (
    <section className="session-review" aria-label="Secret mission review">
      <strong className="session-review__person">
        {ownerAvatarUrl && (
          <Avatar name={owner} imageSrc={ownerAvatarUrl} variant="compact" />
        )}
        SECRET MISSION REVIEW · {owner}
      </strong>
      <h2>{title}</h2>
      <p>{description}</p>
      {evidence.length ? (
        <EvidenceGallery items={evidence} />
      ) : (
        <p>No photo or video submitted for this mission.</p>
      )}
      <output>
        {votesCast} votes cast
        {open ? " · results appear when voting closes" : ""}
      </output>
      {open && onVote && (
        <div className="session-review__actions">
          <button
            type="button"
            aria-pressed={vote === "success"}
            disabled={busy}
            onClick={() => onVote("success")}
          >
            SUCCESS
          </button>
          <button
            type="button"
            aria-pressed={vote === "fail"}
            disabled={busy}
            onClick={() => onVote("fail")}
          >
            FAIL
          </button>
        </div>
      )}
      {!open && outcome && (
        <>
          <h3>{outcome.toUpperCase()}</h3>
          <p>
            {outcome === "success"
              ? `+${points} points awarded`
              : "No points awarded · final result"}
          </p>
          <p>
            {successVotes ?? 0} Success · {failVotes ?? 0} Fail
          </p>
          <p>
            Who voted:{" "}
            {voters.length
              ? voters.map((voter, index) => (
                  <span key={voter.id}>
                    {index > 0 && ", "}
                    <span className="session-review__person">
                      {voter.avatarUrl && (
                        <Avatar
                          name={voter.name}
                          imageSrc={voter.avatarUrl}
                          variant="compact"
                        />
                      )}
                      {voter.name} ({voter.vote})
                    </span>
                  </span>
                ))
              : "No voters"}
          </p>
          <SessionLeaderboard
            title="Leaderboard changes"
            entries={leaderboard}
            viewerId={viewerId}
          />
        </>
      )}
    </section>
  );
}
