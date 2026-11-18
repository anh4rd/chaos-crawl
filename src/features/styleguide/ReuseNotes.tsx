import Overline from "../../components/ui/Overline";
import FoundationPanel from "./FoundationPanel";
export default function ReuseNotes() {
  return (
    <FoundationPanel>
      <Overline tone="primary">REUSE NOTES</Overline>
      <h3>Compose first.</h3>
      <p>
        Use Button, Input and Card for the existing legacy UI. Use the shared
        session components for player screens and the host CSS patterns for host
        screens.
      </p>
      <p>
        The host buttons are CSS classes, not variants of the Button component.
        Keep their context when reusing them.
      </p>
      <p>
        Source paths are relative to the repository root. Adjust import paths to
        the consuming file.
      </p>
    </FoundationPanel>
  );
}
