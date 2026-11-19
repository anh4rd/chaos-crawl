import { useState } from "react";
import Button from "../../components/ui/Button";
import ControlRow from "../../components/ui/ControlRow";
import Note from "../../components/ui/Note";
import { Example } from "./Example";
export default function ButtonExample() {
  const [pressed, setPressed] = useState(false);
  return (
    <Example
      title="Button"
      source="src/components/ui/Button.tsx"
      code={
        'import Button from "./components/ui/Button";\n\n<Button type="button" fullWidth={false} onClick={onStart}>\n  Start game\n</Button>\n<Button type="button" disabled>Saving...</Button>'
      }
    >
      <ControlRow>
        <Button
          type="button"
          fullWidth={false}
          onClick={() => setPressed((value) => !value)}
        >
          {pressed ? "Ready to go!" : "Start game"}
        </Button>
        <Button type="button" fullWidth={false} disabled>
          Saving…
        </Button>
      </ControlRow>
      <Note>Full width by default · native disabled and click props</Note>
      <p role="status">
        {pressed ? "Demo action selected." : "Try the primary action."}
      </p>
    </Example>
  );
}
