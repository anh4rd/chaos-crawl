var e=`import PanelGrid from "../../components/ui/PanelGrid";
import Note from "../../components/ui/Note";
import Overline from "../../components/ui/Overline";
import PanelHeading from "../../components/ui/PanelHeading";
import ContentPanel from "../../components/ui/ContentPanel";
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
    <ContentPanel variant="console-white">
      <PanelHeading variant="console">
        <Overline variant="console">{round.label.toUpperCase()}</Overline>
        <Note variant="console-muted" as="span">
          {round.challenges.length} challenges
        </Note>
      </PanelHeading>
      <PanelGrid variant="console-list">
        {round.challenges.map((challenge) => (
          <ChallengeListItem
            key={challenge.id}
            challenge={challenge}
            busy={busy}
          />
        ))}
      </PanelGrid>
    </ContentPanel>
  );
}
`;export{e as default};