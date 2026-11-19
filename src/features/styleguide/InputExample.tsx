import type { Dispatch, SetStateAction } from "react";
import Input from "../../components/ui/Input";
import Note from "../../components/ui/Note";
import { Example } from "./Example";
export default function InputExample({
  name,
  setName,
}: {
  name: string;
  setName: Dispatch<SetStateAction<string>>;
}) {
  return (
    <Example
      className="input-example"
      title="Input"
      source="src/components/ui/Input.tsx"
      code={
        'import Input from "./components/ui/Input";\n\n<label htmlFor="team-name">Team name</label>\n<Input id="team-name" value={name}\n  onChange={(event) => setName(event.target.value)} />'
      }
    >
      <label htmlFor="sg-team-name" className="input-example__label">
        Team name
      </label>
      <Input
        id="sg-team-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <label htmlFor="sg-disabled-field" className="input-example__label">
        Disabled field
      </label>
      <Input
        id="sg-disabled-field"
        disabled
        placeholder="Waiting for the host"
      />
      <Note>Always pair an input with a visible label.</Note>
    </Example>
  );
}
