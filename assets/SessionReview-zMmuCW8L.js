var e=`import EvidenceGallery from "./EvidenceGallery";
import SessionLeaderboard from "./SessionLeaderboard";
import type { EvidencePresentation, RankedParticipant } from "./types";
export default function SessionReview({
  title,
  description,
  owner,
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
  voters: { id: string; name: string; vote: "success" | "fail" }[];
  leaderboard: RankedParticipant[];
  viewerId?: string | null;
}) {
  return (
    <section className="session-review" aria-label="Secret mission review">
      <strong>SECRET MISSION REVIEW · {owner}</strong>
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
              ? \`+\${points} points awarded\`
              : "No points awarded · final result"}
          </p>
          <p>
            {successVotes ?? 0} Success · {failVotes ?? 0} Fail
          </p>
          <p>
            Who voted:{" "}
            {voters
              .map((voter) => \`\${voter.name} (\${voter.vote})\`)
              .join(", ") || "No voters"}
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
`;export{e as default};