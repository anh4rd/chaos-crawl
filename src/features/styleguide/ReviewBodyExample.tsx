import ReviewSummary from "../../components/session/ReviewSummary";
import SessionLeaderboard from "../../components/session/SessionLeaderboard";
import VoterList from "../../components/session/VoterList";
import ContentPanel from "../../components/ui/ContentPanel";
import { Example } from "./Example";

export default function ReviewBodyExample() {
  return (
    <Example
      title="Review summary and published results"
      source="src/components/session/ReviewSummary.tsx + VoterList.tsx + SessionLeaderboard.tsx"
      code={
        '<ReviewSummary title="Make an entrance" detail="For Alex · 20 points" description="Show your best entrance." />'
      }
    >
      <ContentPanel as="div" variant="review-controls">
        <ReviewSummary
          title="Make an entrance"
          detail="For Alex · 20 points"
          description="Show your best entrance."
        />
        <ContentPanel as="div" variant="review-result">
          <strong>Success</strong>
          <span>
            These are published sample results. The caller hides them during
            voting.
          </span>
          <VoterList
            voters={[
              { id: "sam", name: "Sam", choice: "Success" },
              { id: "lee", name: "Lee", choice: "Fail" },
            ]}
          />
          <strong>Leaderboard changes</strong>
          <SessionLeaderboard
            variant="compact"
            entries={[
              { id: "alex", name: "Alex", score: 120 },
              { id: "sam", name: "Sam", score: 100 },
            ]}
          />
        </ContentPanel>
      </ContentPanel>
    </Example>
  );
}
