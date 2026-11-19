import { useState } from "react";
import ContentPanel from "../../components/ui/ContentPanel";
import PanelHeading from "../../components/ui/PanelHeading";
import PanelGrid from "../../components/ui/PanelGrid";
import Overline from "../../components/ui/Overline";
import CountBadge from "../../components/ui/CountBadge";
import Badge from "../../components/ui/Badge";
import ControlRow from "../../components/ui/ControlRow";
import Button from "../../components/ui/Button";
import HistoryRow from "../../components/ui/HistoryRow";
import StatusPill from "../../components/ui/StatusPill";
import Icon from "../../components/ui/Icon";
import HostPatternPreview from "./HostPatternPreview";
import { Example } from "./Example";

export default function ModerationExample() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">(
    "pending",
  );
  return (
    <Example
      title="Shared review and history"
      source="src/components/ui/HistoryRow.tsx + ContentPanel.tsx"
      code={
        '<HistoryRow title="Local contribution" detail="A local date" status={<StatusPill variant="history" tone="pending">pending</StatusPill>} />'
      }
    >
      <label>
        <input
          type="checkbox"
          checked={busy}
          onChange={(event) => setBusy(event.target.checked)}
        />{" "}
        Simulate local review pending
      </label>
      <HostPatternPreview>
        <ContentPanel variant="moderation">
          <PanelHeading variant="moderation">
            <div>
              <Overline variant="moderation">
                <Icon name="shield-check" className="icon--size-14" /> LOCAL
                MODERATION
              </Overline>
              <h2>
                Local review <CountBadge variant="moderation">1</CountBadge>
              </h2>
              <p>These actions update only this preview.</p>
            </div>
          </PanelHeading>
          <PanelGrid variant="stack">
            <ContentPanel as="article" variant="moderation-item">
              <div>
                <Badge variant="moderation-type">challenge</Badge>
                <h3>Local contribution</h3>
                <p>A controlled review item with supplied copy.</p>
                <small>Submitted locally</small>
              </div>
              <ControlRow variant="moderation">
                <Button
                  type="button"
                  variant="moderation-approve"
                  fullWidth={false}
                  disabled={busy}
                  onClick={() => setStatus("approved")}
                >
                  <Icon name="check-circle2" className="icon--size-15" />{" "}
                  Approve locally
                </Button>
                <Button
                  type="button"
                  variant="moderation-secondary"
                  fullWidth={false}
                  disabled={busy}
                  onClick={() => setStatus("rejected")}
                >
                  <Icon name="x-circle" className="icon--size-15" /> Reject
                  locally
                </Button>
              </ControlRow>
            </ContentPanel>
          </PanelGrid>
        </ContentPanel>
        <ContentPanel variant="history">
          <PanelHeading variant="moderation">
            <div>
              <h3>Local history</h3>
              <p>Caller-supplied details and status.</p>
            </div>
          </PanelHeading>
          <PanelGrid variant="stack">
            <HistoryRow
              title="Latest local decision"
              detail="challenge · submitted locally"
              note="The caller owns this review note."
              status={
                <StatusPill variant="history" tone={status}>
                  {status}
                </StatusPill>
              }
            />
            <HistoryRow
              title="Pending example"
              detail="challenge · submitted locally"
              status={
                <StatusPill variant="history" tone="pending">
                  pending
                </StatusPill>
              }
            />
            <HistoryRow
              title="Approved example"
              detail="challenge · submitted locally"
              status={
                <StatusPill variant="history" tone="approved">
                  approved
                </StatusPill>
              }
            />
            <HistoryRow
              title="Rejected example"
              detail="challenge · submitted locally"
              status={
                <StatusPill variant="history" tone="rejected">
                  rejected
                </StatusPill>
              }
            />
          </PanelGrid>
        </ContentPanel>
      </HostPatternPreview>
      <output>Local decision: {status}.</output>
    </Example>
  );
}
