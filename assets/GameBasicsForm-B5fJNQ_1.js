var e=`import ContentPanel from "../../components/ui/ContentPanel";
import ImageUpload from "../../components/ui/ImageUpload";
import FormGrid from "../../components/ui/FormGrid";
import type { ReactNode } from "react";
import Icon from "../../components/ui/Icon";
import { Field } from "../../components/ui/Field";
import { today } from "../../utils/dateTime";
import type { SetupForm, UpdatePlan } from "./types";
export default function GameBasicsForm({
  form,
  update,
  uploadGamePhoto,
  navigation,
}: {
  form: SetupForm;
  update: UpdatePlan;
  uploadGamePhoto: (file: File) => Promise<void>;
  navigation: ReactNode;
}) {
  return (
    <ContentPanel variant="form" className="plan-basics">
      <div className="step-label">
        <Icon name="sparkles" className="icon--size-16" /> STEP 1 · GAME BASICS
      </div>
      <h2>Let's set the scene</h2>
      <p className="muted-copy">
        Just the essentials. The detailed planning happens in the next step.
      </p>
      <ImageUpload
        label="Game photo"
        description="Add a photo or graphic to personalise the player welcome screen."
        imageSrc={form.gamePhotoUrl}
        alt="Game cover"
        onFile={uploadGamePhoto}
      />
      <FormGrid>
        <Field label="Game name">
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Iona's birthday chaos"
          />
        </Field>
        <Field label="Event date">
          <input
            type="date"
            min={today()}
            value={form.eventDate}
            onChange={(e) => update("eventDate", e.target.value)}
          />
        </Field>
        <Field label="Start time">
          <input
            type="time"
            value={form.startTime}
            onChange={(e) => update("startTime", e.target.value)}
          />
        </Field>
        <Field
          label="Ideal end time"
          hint="A target, not a hard stop. The schedule will estimate the finish time."
        >
          <input
            type="time"
            value={form.idealEndTime}
            onChange={(e) => update("idealEndTime", e.target.value)}
          />
        </Field>
        <Field label="Approximate number of players">
          <input
            type="number"
            min={2}
            max={100}
            value={form.playerCount}
            onChange={(e) => update("playerCount", Number(e.target.value))}
          />
        </Field>
      </FormGrid>
      {navigation}
    </ContentPanel>
  );
}
`;export{e as default};