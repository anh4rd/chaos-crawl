import Explainer from "../../components/ui/Explainer";
import FormGrid from "../../components/ui/FormGrid";
import ContentPanel from "../../components/ui/ContentPanel";
import { Field } from "../../components/ui/Field";
import Icon from "../../components/ui/Icon";
import { Toggle } from "../../components/ui/Toggle";
import { accessOptions } from "./catalog";
import { type SetupForm } from "./types";

interface PlayerSetupProps {
  form: SetupForm;
  update: <K extends keyof SetupForm>(key: K, value: SetupForm[K]) => void;
  canChangeHostParticipation?: boolean;
}

export default function PlayerSetup({
  form,
  update,
  canChangeHostParticipation = true,
}: PlayerSetupProps) {
  return (
    <ContentPanel variant="section">
      <FormGrid>
        <Field label="Approximate player count">
          <input
            type="number"
            min={2}
            max={100}
            value={form.playerCount}
            onChange={(e) => update("playerCount", Number(e.target.value))}
          />
        </Field>
        <Field label="Age group">
          <select
            value={form.ageGroup}
            onChange={(e) => update("ageGroup", e.target.value)}
          >
            <option value="adults">Adults</option>
            <option value="under-18">Under 18</option>
            <option value="mixed">Mixed ages</option>
          </select>
        </Field>
        <Field label="Alcohol at the event">
          <select
            value={form.alcohol}
            onChange={(e) => update("alcohol", e.target.value)}
          >
            <option value="no">No alcohol-based tasks</option>
            <option value="yes">Alcohol is okay</option>
            <option value="mixed">Keep it optional</option>
          </select>
        </Field>
      </FormGrid>
      {canChangeHostParticipation ? (
        <Toggle
          title="Host joins the game"
          detail="You will appear as a player and can complete challenges too."
          checked={form.hostParticipates}
          onChange={(v) => update("hostParticipates", v)}
        />
      ) : (
        <p>Only the game owner can change host participation.</p>
      )}
      <Toggle
        title="Use teams"
        detail="Players compete in teams instead of individually."
        checked={form.teamsEnabled}
        onChange={(v) => update("teamsEnabled", v)}
      />
      {form.teamsEnabled && (
        <>
          <Field label="Players per team">
            <select
              value={form.teamSize ?? "later"}
              onChange={(e) =>
                update(
                  "teamSize",
                  e.target.value === "later" ? null : Number(e.target.value),
                )
              }
            >
              <option value="later">Decide during the game</option>
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} players
                </option>
              ))}
            </select>
          </Field>
          <Field label="Who assigns teams?">
            <select
              value={form.teamSetup}
              onChange={(e) =>
                update("teamSetup", e.target.value as SetupForm["teamSetup"])
              }
            >
              <option value="later">Decide during the game</option>
              <option value="host">Host assigns teams</option>
              <option value="players">Players choose teams</option>
            </select>
          </Field>
          <Explainer>
            <Icon name="users" className="icon--size-18" />
            <p>
              If you choose host assignment, you'll pick teams during the game
              after everyone has joined. You don't need to decide the teams now.
            </p>
          </Explainer>
        </>
      )}
      <Field
        label="Accessibility requirements"
        hint="Challenges will be filtered using their accessibility information."
      >
        <select
          multiple
          value={form.accessibility}
          onChange={(e) =>
            update(
              "accessibility",
              Array.from(e.target.selectedOptions).map((o) => o.value),
            )
          }
        >
          {accessOptions.map((v, i) => (
            <option
              key={v}
              value={
                [
                  "seated-option",
                  "low-noise-option",
                  "no-running",
                  "no-alcohol",
                  "low-sensory-load",
                  "mobility-flexible",
                  "no-public-interaction",
                ][i]
              }
            >
              {v}
            </option>
          ))}
        </select>
      </Field>
    </ContentPanel>
  );
}
