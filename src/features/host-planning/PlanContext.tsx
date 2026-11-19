import ContextCard from "../../components/ui/ContextCard";
import Ribbon from "../../components/ui/Ribbon";
import CoverArtwork from "../../components/ui/CoverArtwork";
import ChecklistProgress from "../../components/ui/ChecklistProgress";
import SetupAction from "../../components/ui/SetupAction";
import HintCard from "../../components/ui/HintCard";
import Icon from "../../components/ui/Icon";
import type { SetupForm } from "./types";
export default function PlanContext({
  form,
  stage,
  setupChecks,
  nextLabel,
  onNext,
}: {
  form: SetupForm;
  stage: "create" | "build";
  setupChecks: Array<{ label: string; done: boolean }>;
  nextLabel?: string;
  onNext: () => void;
}) {
  const completedSetup = setupChecks.filter((item) => item.done).length;
  return (
    <div className="game-context">
      <ContextCard className="game-overview">
        <Ribbon>GAME OVERVIEW</Ribbon>
        <CoverArtwork
          variant="overview"
          name={form.name || "Your new game"}
          initial="CHAOS!"
          iconClassName="icon--size-34"
        />
        <h3>{form.name || "Your new game"}</h3>
        <ul>
          <li>
            <Icon name="calendar-days" className="icon--size-15" />
            {form.eventDate || "Date to be confirmed"}
          </li>
          <li>
            <Icon name="users" className="icon--size-15" />
            {form.playerCount} players (target)
          </li>
          <li>
            <Icon name="map-pin" className="icon--size-15" />
            {form.venueName || "Venue not set"}
          </li>
        </ul>
      </ContextCard>
      <ChecklistProgress
        checks={setupChecks.map((item, index) => ({
          ...item,
          marker: item.done ? "✓" : index + 1,
        }))}
        summary={
          <>
            {completedSetup} of {setupChecks.length} complete
          </>
        }
      >
        <SetupAction type="button" onClick={onNext}>
          {stage === "create"
            ? "Next: Players & Teams →"
            : nextLabel
              ? `Next: ${nextLabel} →`
              : "Save game plan →"}
        </SetupAction>
      </ChecklistProgress>
      <HintCard icon="sparkles">
        <strong>Little by little.</strong> You can save a draft and come back
        whenever inspiration strikes.
      </HintCard>
    </div>
  );
}
