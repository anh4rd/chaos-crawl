var e=`import Explainer from "../../components/ui/Explainer";
import ContentPanel from "../../components/ui/ContentPanel";
import Icon from "../../components/ui/Icon";
import { Toggle } from "../../components/ui/Toggle";
import { type RewardMode, type SetupForm } from "./types";

interface GameOptionsProps {
  form: SetupForm;
  update: <K extends keyof SetupForm>(key: K, value: SetupForm[K]) => void;
}

export default function GameOptions({ form, update }: GameOptionsProps) {
  return (
    <ContentPanel variant="section">
      <Explainer>
        <Icon name="wand-sparkles" className="icon--size-18" />
        <p>
          <strong>
            Reward methods are separate from the side-challenge final.
          </strong>{" "}
          Choose which methods the host can use for ordinary reward rounds. Side
          challenges always have their own final vote at the end.
        </p>
      </Explainer>
      <Toggle
        title="Decide reward method during the game"
        detail="Recommended. The host chooses voting, host awards or audience cheers when a reward round happens."
        checked={form.decideRewardInGame}
        onChange={(v) => {
          update("decideRewardInGame", v);
          if (v) update("rewardModes", []);
        }}
      />
      {!form.decideRewardInGame && (
        <div className="choice-grid">
          <p>Enable one or more methods:</p>
          {(
            [
              ["voting", "Player voting"],
              ["host-awards", "Host awards"],
              ["audience-cheers", "Audience cheers"],
            ] as [RewardMode, string][]
          ).map(([value, label]) => (
            <label key={value}>
              <input
                type="checkbox"
                checked={form.rewardModes.includes(value)}
                onChange={(e) =>
                  update(
                    "rewardModes",
                    e.target.checked
                      ? [...form.rewardModes, value]
                      : form.rewardModes.filter((x) => x !== value),
                  )
                }
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      )}
      <div className="required-feature">
        <Icon name="check-circle2" className="icon--size-24" />
        <div>
          <strong>Fan-favourite final vote</strong>
          <p>
            {form.sideChallenges
              ? "Required because side challenges are enabled. It always happens at the end of the game."
              : "This becomes compulsory automatically if you enable side challenges."}
          </p>
        </div>
        <span>Always on with side challenges</span>
      </div>
      <Toggle
        title="Side challenges"
        detail="Optional tasks with evidence, review, slideshow and final voting."
        checked={form.sideChallenges}
        onChange={(v) => {
          update("sideChallenges", v);
          if (v) {
            update("liveFinal", true);
            update("slideshow", true);
          }
        }}
      />
      {form.sideChallenges && (
        <Explainer>
          <Icon name="info" className="icon--size-18" />
          <p>
            The live final and TV slideshow are automatically enabled. The host
            gathers everyone around the screen to review side-challenge evidence
            before the final vote.
          </p>
        </Explainer>
      )}
      <Toggle
        title="Secret missions"
        detail="Individual private tasks. Every player needs an assigned mission and evidence is required."
        checked={form.secretMissions}
        onChange={(v) => update("secretMissions", v)}
      />
      <Toggle
        title="Strict schedule"
        detail="Turns on challenge timers and makes the schedule the default running order."
        checked={form.strictSchedule}
        onChange={(v) => {
          update("strictSchedule", v);
          update("challengeTimers", v);
        }}
      />
      <Toggle
        title="Autoplay scheduled rounds"
        detail="Automatically advance when a timed round finishes."
        checked={form.autoplay}
        onChange={(v) => update("autoplay", v)}
      />
    </ContentPanel>
  );
}
`;export{e as default};