import { Field } from "../../components/ui/Field";
import Icon from "../../components/ui/Icon";
import { type SetupForm } from "./types";

interface SecretMissionTimingProps {
  form: SetupForm;
  update: <K extends keyof SetupForm>(key: K, value: SetupForm[K]) => void;
}

export default function SecretMissionTiming({
  form,
  update,
}: SecretMissionTimingProps) {
  return (
    <section className="cc-section-card">
      <h3>Mission reveal timing</h3>
      <p>
        Choose whether reveals happen at a planned point in the game or at a
        random time.
      </p>
      <Field label="Reveal method">
        <select
          value={form.secretRevealMode}
          onChange={(e) => {
            const mode = e.target.value as SetupForm["secretRevealMode"];
            update("secretRevealMode", mode);
            if (mode === "random")
              update(
                "schedule",
                form.schedule.filter((item) => item.type !== "secret-reveal"),
              );
            else if (
              form.selectedSecret.length &&
              !form.schedule.some((item) => item.type === "secret-reveal")
            )
              update("schedule", [
                ...form.schedule,
                {
                  id: "secret-reveal",
                  type: "secret-reveal",
                  title: "Reveal secret missions",
                  duration: 0,
                },
              ]);
          }}
        >
          <option value="scheduled">Scheduled reveal</option>
          <option value="random">Random reveal</option>
        </select>
      </Field>
      {form.secretRevealMode === "scheduled" && (
        <Field label="Reveal after the game starts (minutes)">
          <input
            type="number"
            min={0}
            max={600}
            value={form.secretRevealAfterMinutes}
            onChange={(e) =>
              update(
                "secretRevealAfterMinutes",
                Math.max(0, Number(e.target.value)),
              )
            }
          />
        </Field>
      )}
      <div className="cc-explainer cc-explainer--pink">
        <Icon name="info" className="icon--size-18" />
        <p>
          Player assignment happens after joining, from the host's live game
          controls. Scheduled reveals are automatically shown in the Schedule;
          random reveals are not given a fixed slot.
        </p>
      </div>
    </section>
  );
}
