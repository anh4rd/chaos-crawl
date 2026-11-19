import PageFrame from "../../components/ui/PageFrame";
import { Example } from "./Example";

export default function PageFrameExample() {
  return (
    <Example
      title="Shared legacy page frame"
      source="src/components/ui/PageFrame.tsx"
      code={
        '<PageFrame as="div" variant="bare">\n  <h4>Composed page content</h4>\n  <p>Caller-owned content and coordination.</p>\n</PageFrame>'
      }
    >
      <PageFrame as="div" variant="bare" aria-label="Local page frame">
        <h4>Composed page content</h4>
        <p>Legacy join, gameplay and leaderboard use this native page frame.</p>
      </PageFrame>
      <details>
        <summary>Content frame with native section semantics</summary>
        <PageFrame
          as="section"
          variant="content"
          aria-label="Local content frame"
        >
          <h4>Content without child spacing</h4>
          <p>
            This variant retains the legacy page width, padding and viewport
            minimum.
          </p>
        </PageFrame>
      </details>
    </Example>
  );
}
