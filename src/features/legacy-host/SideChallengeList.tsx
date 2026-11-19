import PanelGrid from "../../components/ui/PanelGrid";
import Note from "../../components/ui/Note";
import CountBadge from "../../components/ui/CountBadge";
import Overline from "../../components/ui/Overline";
import PanelHeading from "../../components/ui/PanelHeading";
import ContentPanel from "../../components/ui/ContentPanel";
import SideChallengeItem from "./SideChallengeItem";
import type { SideChallengeItemModel } from "./types";

export default function SideChallengeList({
  challenges,
}: {
  challenges: SideChallengeItemModel[];
}) {
  return (
    <ContentPanel variant="console-tint">
      <PanelHeading variant="console-section">
        <div>
          <Overline variant="console-eyebrow" as="p">
            OPTIONAL TASKS
          </Overline>
          <h2>Side challenges</h2>
        </div>
        <CountBadge variant="console">{challenges.length}</CountBadge>
      </PanelHeading>
      <Note variant="console-body">
        These can be completed at any point during the party.
      </Note>
      {challenges.length ? (
        <PanelGrid variant="console-list">
          {challenges.map((challenge) => (
            <SideChallengeItem key={challenge.id} challenge={challenge} />
          ))}
        </PanelGrid>
      ) : (
        <Note variant="console-empty">No active side challenges found.</Note>
      )}
    </ContentPanel>
  );
}
