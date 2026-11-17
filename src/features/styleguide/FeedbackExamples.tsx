import { useState } from "react";
import GuidedTour from "../../components/tour/GuidedTour";
import Button from "../../components/ui/Button";
import DataError from "../../components/ui/DataError";
import ScheduledCountdown from "../ScheduledCountdown";
import QueryPanel from "../admin/QueryPanel";
import { Example } from "./Example";

export function FeedbackExamples() {
  const [failed, setFailed] = useState(true);
  const [tour, setTour] = useState(false);
  const [targetTime] = useState(() =>
    new Date(Date.now() + 5 * 60_000).toISOString(),
  );
  return (
    <>
      <div className="sg-grid">
        <Example
          title="QueryPanel"
          source="src/features/admin/QueryPanel.tsx"
          code={
            '<QueryPanel queries={[query]} loadingText="Loading challenges...">\n  <ChallengeList challenges={query.data} />\n</QueryPanel>\n// query supplies loading, error and async reload.'
          }
        >
          <div className="sg-state">
            <strong>Loading</strong>
            <QueryPanel
              queries={[{ loading: true, error: null, reload: async () => {} }]}
              loadingText="Loading challenges…"
            >
              <p>Challenge list</p>
            </QueryPanel>
          </div>
          <div className="sg-state">
            <strong>Loaded / empty</strong>
            <QueryPanel
              queries={[
                { loading: false, error: null, reload: async () => {} },
              ]}
              loadingText="Loading challenges…"
            >
              <p>No challenges yet. Add your first challenge to get started.</p>
            </QueryPanel>
          </div>
        </Example>
        <Example
          title="DataError"
          source="src/components/ui/DataError.tsx"
          code={
            '<DataError\n  error={new Error("Could not load the game.")}\n  retry={reload}\n/>\n// Page-level component: renders its own <main>.'
          }
        >
          {failed ? (
            <div role="region" aria-label="Error example">
              <DataError
                as="div"
                error={new Error("Demo: could not load the game.")}
                retry={async () => setFailed(false)}
              />
            </div>
          ) : (
            <div className="sg-state">
              <p role="status">Demo recovered successfully.</p>
              <button
                className="sg-text-button"
                type="button"
                onClick={() => setFailed(true)}
              >
                Show error again
              </button>
            </div>
          )}
        </Example>
        <Example
          title="ScheduledCountdown"
          source="src/features/ScheduledCountdown.tsx"
          code={
            "<ScheduledCountdown targetTime={scheduledRevealAt} />\n// ISO date string; null renders nothing."
          }
        >
          <p className="sg-timer">
            <ScheduledCountdown targetTime={targetTime} />
          </p>
          <p className="sg-note">
            Live countdown · five minutes from opening this page
          </p>
          <p>
            Expired: <ScheduledCountdown targetTime="2020-01-01T00:00:00Z" />
          </p>
        </Example>
        <Example
          title="GuidedTour"
          source="src/components/tour/GuidedTour.tsx"
          code={
            '<GuidedTour\n  steps={[{ target: "#tour-target", title: "Start here", body: "Your next step." }]}\n  onClose={() => setTourOpen(false)}\n/>'
          }
        >
          <Button fullWidth={false} type="button" onClick={() => setTour(true)}>
            Preview guided tour
          </Button>
          <p className="sg-note">
            Uses the real tour overlay and existing page targets.
          </p>
        </Example>
      </div>
      {tour && (
        <GuidedTour
          label="STYLEGUIDE TOUR"
          steps={[
            {
              target: "#sg-feedback-title",
              title: "Feedback that helps",
              body: "Reuse loading, retry and countdown components to keep game states consistent.",
            },
            {
              target: "#sg-catalog-title",
              title: "Find the source",
              body: "Search the catalog for component contracts, source paths and dependencies.",
            },
          ]}
          onClose={() => setTour(false)}
        />
      )}
    </>
  );
}
