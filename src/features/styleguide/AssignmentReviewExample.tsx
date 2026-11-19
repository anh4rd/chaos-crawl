import { useState } from "react";
import AssignmentList from "../../components/session/AssignmentList";
import AssignmentRow from "../../components/session/AssignmentRow";
import ContentPanel from "../../components/ui/ContentPanel";
import EmptyState from "../../components/ui/EmptyState";
import HostManagement from "../host-live/HostManagement";
import { Example } from "./Example";
import SessionPreview from "./SessionPreview";

export default function AssignmentReviewExample() {
  const [empty, setEmpty] = useState(false);
  return (
    <Example
      title="Shared assignment rows and empty state"
      source="src/components/session/AssignmentRow.tsx + AssignmentList.tsx"
      code={
        '<AssignmentList>\n  <AssignmentRow icon="🍍" title="Find a pineapple" recipient="For Pat" status="Needs review" />\n</AssignmentList>'
      }
    >
      <SessionPreview>
        <HostManagement>
          <ContentPanel
            variant="session"
            stacked
            aria-label="Local assignments"
          >
            {empty ? (
              <EmptyState icon="shield" variant="session">
                No sample assignments. Restore the list with the checkbox below.
              </EmptyState>
            ) : (
              <AssignmentList>
                <AssignmentRow
                  icon="🍍"
                  title="Find a pineapple"
                  recipient="For Pat"
                  status="Needs review"
                />
                <AssignmentRow
                  icon="🕵️"
                  title="Secret handshake"
                  recipient="For Sam"
                  status="Scheduled · tomorrow"
                />
              </AssignmentList>
            )}
          </ContentPanel>
        </HostManagement>
      </SessionPreview>
      <label>
        <input
          type="checkbox"
          checked={empty}
          onChange={(event) => setEmpty(event.target.checked)}
        />{" "}
        Show empty sample assignments
      </label>
    </Example>
  );
}
