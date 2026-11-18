import type { SubmissionHistoryItem } from "./viewTypes";

export default function SubmissionHistory({
  items,
}: {
  items: SubmissionHistoryItem[];
}) {
  // Preserve text runs so the date labels retain their original measured widths.
  return (
    <section className="host-my-submissions">
      <div className="host-community-section-heading">
        <div>
          <h3>Your submissions</h3>
          <p>
            Approved challenges appear in the shared library. Pending items are
            only visible to you and moderators.
          </p>
        </div>
      </div>
      <div className="host-my-submissions-list">
        {items.map((submission) => (
          <div className="host-my-submission" key={submission.id}>
            <div>
              <strong>{submission.title}</strong>
              <small>
                {submission.itemType}
                {" · submitted"} {submission.submittedDate}
              </small>
              {submission.reviewNote && <small>{submission.reviewNote}</small>}
            </div>
            <span
              className={`host-submission-status host-submission-status--${submission.status}`}
            >
              {submission.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
