import Note from "../../components/ui/Note";
import Overline from "../../components/ui/Overline";
import ColorPalette from "./ColorPalette";
import ExampleGrid from "./ExampleGrid";
import FoundationPanel from "./FoundationPanel";
import IconSamples from "./IconSamples";
import { Section } from "./Section";
import TypeSample from "./TypeSample";
export default function FoundationExamples() {
  return (
    <Section
      id="foundations"
      number="01"
      title="Foundations"
      description="The existing palette and typography, straight from Globals.css."
    >
      <ColorPalette />
      <Note>
        Player and host screens also use #d3fb6e for lime accents; the Button
        retains the original lime-300 value through an SCSS token. These are
        existing values, not interchangeable tokens.
      </Note>
      <ExampleGrid spaced>
        <FoundationPanel>
          <Overline tone="primary">DISPLAY / HARDBEAT</Overline>
          <TypeSample variant="display">Bring the chaos</TypeSample>
          <p>
            Use for short, expressive headings. Font files live in public/fonts.
          </p>
        </FoundationPanel>
        <FoundationPanel>
          <Overline tone="primary">BODY / QUICKSAND</Overline>
          <TypeSample variant="body">
            Good games start with clear instructions.
          </TypeSample>
          <p>
            Regular body copy with bold labels. The global font stack includes
            system fallbacks.
          </p>
          <IconSamples />
        </FoundationPanel>
      </ExampleGrid>
    </Section>
  );
}
