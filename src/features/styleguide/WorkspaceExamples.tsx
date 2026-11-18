import { useState } from "react";
import StatTile from "../../components/ui/StatTile";
import IconBadge from "../../components/ui/IconBadge";
import StatusPill from "../../components/ui/StatusPill";
import ContextCard from "../../components/ui/ContextCard";
import CoverArtwork from "../../components/ui/CoverArtwork";
import Ribbon from "../../components/ui/Ribbon";
import HintCard from "../../components/ui/HintCard";
import ChecklistProgress from "../../components/ui/ChecklistProgress";
import SetupAction from "../../components/ui/SetupAction";
import ChallengeIcons from "../../components/challenge/ChallengeIcons";
import ControlRow from "../../components/ui/ControlRow";
import Note from "../../components/ui/Note";
import { Example } from "./Example";
import HostPatternPreview from "./HostPatternPreview";
import ExampleGrid from "./ExampleGrid";
export default function WorkspaceExamples() {
  const [completed, setCompleted] = useState(1);
  const checks = ["Game details", "Players", "Venue"].map((label, index) => ({
    label,
    done: index < completed,
    marker: index < completed ? "✓" : "○",
  }));
  return (
    <>
      <Example
        title="StatTile + IconBadge + StatusPill"
        source="src/components/ui/StatTile.tsx + IconBadge.tsx + StatusPill.tsx"
        code={
          '<StatTile icon="users" tone="violet" value={12} label="Players planned" />\n<StatusPill tone="live">Live</StatusPill>'
        }
      >
        <HostPatternPreview>
          <div className="stat-grid">
            <StatTile icon="calendar-days" value={3} label="Upcoming games" />
            <StatTile
              icon="users"
              tone="violet"
              value={12}
              label="Players planned"
            />
            <StatTile
              icon="sparkles"
              tone="pink"
              value={4}
              label="Saved plans"
            />
          </div>
          <ControlRow>
            <IconBadge icon="users" />
            {(["planned", "draft", "live", "completed"] as const).map(
              (status) => (
                <StatusPill key={status} tone={status}>
                  {status}
                </StatusPill>
              ),
            )}
          </ControlRow>
        </HostPatternPreview>
      </Example>
      <Example
        title="CoverArtwork"
        source="src/components/ui/CoverArtwork.tsx"
        code={
          '<CoverArtwork name="Friday crawl" imageSrc={coverUrl} />\n<CoverArtwork name="Friday crawl" />'
        }
      >
        <HostPatternPreview>
          <ExampleGrid>
            <CoverArtwork
              name="Friday crawl"
              imageSrc={`${import.meta.env.BASE_URL}chaos-logo.png`}
            />
            <CoverArtwork name="Friday crawl" />
          </ExampleGrid>
        </HostPatternPreview>
      </Example>
      <Example
        title="Shared workspace panels"
        source="src/components/ui/ChecklistProgress.tsx + ContextCard.tsx"
        code={
          '<ChecklistProgress checks={checks} summary="1 of 3 complete">\n  <SetupAction type="button" onClick={continueSetup}>Continue setup</SetupAction>\n</ChecklistProgress>\n<ContextCard><Ribbon>GAME OVERVIEW</Ribbon><CoverArtwork name="Friday crawl" variant="overview" /></ContextCard>'
        }
      >
        <HostPatternPreview>
          <ExampleGrid>
            <ContextCard>
              <Ribbon>GAME OVERVIEW</Ribbon>
              <CoverArtwork name="Friday crawl" variant="overview" />
              <ChallengeIcons
                tasks={[
                  {
                    id: "entrance",
                    title: "Make an entrance",
                    description: "Show your best entrance",
                  },
                ]}
              />
            </ContextCard>
            <ChecklistProgress
              checks={checks}
              summary={`${completed} of ${checks.length} complete`}
            >
              <SetupAction
                type="button"
                onClick={() =>
                  setCompleted((value) => (value + 1) % (checks.length + 1))
                }
              >
                Advance demo setup
              </SetupAction>
            </ChecklistProgress>
          </ExampleGrid>
          <HintCard icon="sparkles">
            <strong>Make it yours.</strong> These panels use local state.
          </HintCard>
          <Note as="output">{completed} setup items complete.</Note>
        </HostPatternPreview>
      </Example>
    </>
  );
}
