var e=`import ContentPanel from "../../../components/ui/ContentPanel";
import PanelGrid from "../../../components/ui/PanelGrid";
import Note from "../../../components/ui/Note";
import DisplayHeading from "../../../components/ui/DisplayHeading";
import Card from "../../../components/ui/Card";
export interface CompletionReviewItem {
  id: string | number;
  playerName: string;
  challengeTitle: string;
  kind: string;
  points: number;
  hasMedia: boolean;
}
export default function CompletionReviewView({
  completions,
}: {
  completions: readonly CompletionReviewItem[];
}) {
  return (
    <Card>
      <DisplayHeading variant="plain">Challenge Review</DisplayHeading>

      <Note variant="description">
        Completion records and points linked to each challenge.
      </Note>

      {completions.length === 0 ? (
        <Note variant="empty">No completions yet.</Note>
      ) : (
        <PanelGrid variant="feed-tight">
          {completions.map((completion) => (
            <ContentPanel key={completion.id} as="div" variant="ledger">
              <strong>{completion.playerName}</strong>

              <Note variant="detail">{completion.challengeTitle}</Note>

              <Note variant="metadata">
                {completion.kind} • +{completion.points} points
              </Note>

              {completion.hasMedia && (
                <Note variant="media">📸 Media attached</Note>
              )}
            </ContentPanel>
          ))}
        </PanelGrid>
      )}
    </Card>
  );
}
`;export{e as default};