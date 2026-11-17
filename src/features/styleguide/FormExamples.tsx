import { useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Dialog from "../../components/ui/Dialog";
import { Field } from "../../components/ui/Field";
import Icon from "../../components/ui/Icon";
import { Toggle } from "../../components/ui/Toggle";
import { Example } from "./Example";

export default function FormExamples() {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Example
        title="Field + Toggle"
        source="src/components/ui/Field.tsx"
        code={
          '<Field label="Venue" hint="Shown to players"><input /></Field>\n<Toggle title="Challenge timers" detail="Show the shared clock"\n  checked={enabled} onChange={setEnabled} />'
        }
      >
        <Field label="Demo venue" hint="Local example; no game data is saved.">
          <input defaultValue="The Test Venue" />
        </Field>
        <Toggle
          title="Demo challenge timers"
          detail="Show the shared clock"
          checked={enabled}
          onChange={setEnabled}
        />
      </Example>
      <Example
        title="Dialog"
        source="src/components/ui/Dialog.tsx"
        code={
          '{open && <Dialog label="Confirm action" onClose={() => setOpen(false)}>\n  <Card><Button onClick={() => setOpen(false)}>Close</Button></Card>\n</Dialog>}'
        }
      >
        <Button type="button" fullWidth={false} onClick={() => setOpen(true)}>
          Open dialog example
        </Button>
        {open && (
          <Dialog label="Styleguide dialog" onClose={() => setOpen(false)}>
            <Card>
              <h2>Local dialog example</h2>
              <p>
                Tab stays in this dialog. Escape closes it and restores focus.
              </p>
              <Button type="button" onClick={() => setOpen(false)}>
                Close dialog example
              </Button>
            </Card>
          </Dialog>
        )}
      </Example>
      <Example
        title="Icon"
        source="src/components/ui/Icon.tsx"
        code={
          '<Icon name="trophy" className="icon--size-24" aria-hidden="true" />'
        }
      >
        <Icon name="trophy" className="icon--size-24" aria-hidden="true" />
        <p>
          Semantic names map to Lucide glyphs. SCSS controls dimensions; label
          the containing action.
        </p>
      </Example>
    </>
  );
}
