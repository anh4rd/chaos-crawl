import FormGrid from "../../components/ui/FormGrid";
import Explainer from "../../components/ui/Explainer";
import ContentPanel from "../../components/ui/ContentPanel";
import Icon from "../../components/ui/Icon";
import { Field } from "../../components/ui/Field";
import type { SetupForm, UpdatePlan } from "./types";
export default function VenueDetails({
  form,
  update,
}: {
  form: SetupForm;
  update: UpdatePlan;
}) {
  return (
    <ContentPanel variant="section">
      <Explainer>
        <Icon name="map-pin" className="icon--size-18" />
        <p>
          Venue planning will be expanded later. For now, save the main venue so
          the host and players know where the game is happening.
        </p>
      </Explainer>
      <FormGrid>
        <Field label="Venue name">
          <input
            value={form.venueName}
            onChange={(e) => update("venueName", e.target.value)}
            placeholder="Venue name"
          />
        </Field>
        <Field label="Address">
          <input
            value={form.venueAddress}
            onChange={(e) => update("venueAddress", e.target.value)}
            placeholder="Address or postcode"
          />
        </Field>
      </FormGrid>
      <Field label="Venue notes">
        <textarea
          value={form.venueNotes}
          onChange={(e) => update("venueNotes", e.target.value)}
          rows={3}
          placeholder="Access instructions, room details, booking notes…"
        />
      </Field>
    </ContentPanel>
  );
}
