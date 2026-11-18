import ContentPanel from "../../components/ui/ContentPanel";
import PanelHeading from "../../components/ui/PanelHeading";
import PanelGrid from "../../components/ui/PanelGrid";
import HistoryRow from "../../components/ui/HistoryRow";
import StatusPill from "../../components/ui/StatusPill";
import type { SubmissionHistoryItem } from "./viewTypes";

export default function SubmissionHistory({
  items,
}: {
  items: SubmissionHistoryItem[];
}) {
  // Preserve text runs so the date labels retain their original measured widths.
  return (
    <ContentPanel variant="history">
      <PanelHeading variant="moderation">
        <div>
          <h3>Your submissions</h3>
          <p>
            Approved challenges appear in the shared library. Pending items are
            only visible to you and moderators.
          </p>
        </div>
      </PanelHeading>
      <PanelGrid variant="stack">
        {items.map((submission) => (
          <HistoryRow
            key={submission.id}
            title={submission.title}
            detail={
              <>
                {submission.itemType}
                {" · submitted"} {submission.submittedDate}
              </>
            }
            note={submission.reviewNote}
            status={
              <StatusPill variant="history" tone={submission.status}>
                {submission.status}
              </StatusPill>
            }
          />
        ))}
      </PanelGrid>
    </ContentPanel>
  );
}
