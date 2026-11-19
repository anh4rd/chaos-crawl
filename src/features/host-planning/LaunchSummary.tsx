import Explainer from "../../components/ui/Explainer";
import ContentPanel from "../../components/ui/ContentPanel";
import Icon from "../../components/ui/Icon";
import { type SetupForm, type Task } from "./types";

interface LaunchSummaryProps {
  form: SetupForm;
  calculatedEnd: string;
  selectedMainTasks: Task[];
  sideTasks: Task[];
  secretTasks: Task[];
  equipment: string[];
  preparation: Task[];
}

export default function LaunchSummary({
  form,
  calculatedEnd,
  selectedMainTasks,
  sideTasks,
  secretTasks,
  equipment,
  preparation,
}: LaunchSummaryProps) {
  return (
    <ContentPanel variant="section">
      <div className="plan-summary">
        <Icon name="sparkles" className="icon--size-23" />
        <div>
          <small>GAME PLAN</small>
          <h3>{form.name || "Untitled chaos"}</h3>
          <p>
            {form.eventDate} · Starts {form.startTime} · Ideal finish{" "}
            {form.idealEndTime} · Estimated finish {calculatedEnd}
          </p>
        </div>
      </div>
      <div className="summary-grid">
        <div>
          <Icon name="users" className="icon--size-24" />
          <strong>{form.playerCount} players approx.</strong>
          <small>
            {form.teamsEnabled
              ? form.teamSize
                ? `Teams of ${form.teamSize}`
                : "Team size decided later"
              : "Individual play"}
          </small>
        </div>
        <div>
          <Icon name="list-checks" className="icon--size-24" />
          <strong>{selectedMainTasks.length} main challenges</strong>
          <small>
            {sideTasks.length} side · {secretTasks.length} secret
          </small>
        </div>
        <div>
          <Icon name="calendar-days" className="icon--size-24" />
          <strong>{form.schedule.length} schedule items</strong>
          <small>
            {form.strictSchedule ? "Strict timers on" : "Flexible timing"}
          </small>
        </div>
        <div>
          <Icon name="map-pin" className="icon--size-24" />
          <strong>{form.venueName || "Venue TBC"}</strong>
          <small>{form.venueAddress || "Address not added"}</small>
        </div>
      </div>
      <div className="summary-section">
        <h3>Equipment list</h3>
        {equipment.length ? (
          <ul>
            {equipment.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p>No specific equipment listed.</p>
        )}
      </div>
      <div className="summary-section">
        <h3>Preparation for players</h3>
        {preparation.length ? (
          preparation.map((t) => (
            <p key={t.id}>
              <strong>{t.title}:</strong> {t.prep}
            </p>
          ))
        ) : (
          <p>No advance preparation required.</p>
        )}
      </div>
      <div className="summary-section">
        <h3>Reward methods</h3>
        <p>
          {form.decideRewardInGame
            ? "Host decides during the game"
            : form.rewardModes.length
              ? form.rewardModes.join(", ")
              : "No reward method selected"}
        </p>
        <p>
          {form.sideChallenges
            ? "Compulsory live final, slideshow and fan-favourite vote enabled."
            : "No side-challenge final required."}
        </p>
      </div>
      <Explainer>
        <Icon name="shield-check" className="icon--size-18" />
        <p>
          Saving a plan does not launch the game. Player invitations and the
          pre-event portal become available when a session is created from this
          plan.
        </p>
      </Explainer>
      <Explainer>
        <Icon name="play" className="icon--size-18" />
        <p>
          <strong>Host game demo</strong>
          <br />
          The current project has a live-session player preview, but not a safe
          standalone demo route. I have not linked this button to a real session
          because that would create a live game rather than a demo.
        </p>
      </Explainer>
    </ContentPanel>
  );
}
