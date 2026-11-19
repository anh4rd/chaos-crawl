import { useState } from "react";
import StyleguideShell from "../features/styleguide/StyleguideShell";
import StyleguideIntro from "../features/styleguide/StyleguideIntro";
import FoundationExamples from "../features/styleguide/FoundationExamples";
import ExampleGrid from "../features/styleguide/ExampleGrid";
import ButtonExample from "../features/styleguide/ButtonExample";
import InputExample from "../features/styleguide/InputExample";
import CardExample from "../features/styleguide/CardExample";
import PageFrameExample from "../features/styleguide/PageFrameExample";
import ReuseNotes from "../features/styleguide/ReuseNotes";
import FormExamples from "../features/styleguide/FormExamples";
import PosterExamples from "../features/styleguide/PosterExamples";
import SessionChromeExample from "../features/styleguide/SessionChromeExample";
import ChallengeExample from "../features/styleguide/ChallengeExample";
import SessionExamples from "../features/styleguide/SessionExamples";
import TeamChoicesExample from "../features/styleguide/TeamChoicesExample";
import PlayerAccessExample from "../features/styleguide/PlayerAccessExample";
import PrivateMissionExample from "../features/styleguide/PrivateMissionExample";
import SlideshowExample from "../features/styleguide/SlideshowExample";
import LegacySlideshowExample from "../features/styleguide/LegacySlideshowExample";
import LegacyPlayerExample from "../features/styleguide/LegacyPlayerExample";
import LegacyHostExample from "../features/styleguide/LegacyHostExample";
import SessionStatusExample from "../features/styleguide/SessionStatusExample";
import { ParticipationExamples } from "../features/styleguide/ParticipationExamples";
import { FeedbackExamples } from "../features/styleguide/FeedbackExamples";
import HostExamples from "../features/styleguide/HostExamples";
import { Catalog } from "../features/styleguide/ComponentCatalog";
import { Section } from "../features/styleguide/Section";
export default function Styleguide() {
  const [name, setName] = useState("Team Chaos");
  return (
    <StyleguideShell>
      <StyleguideIntro />
      <FoundationExamples />
      <Section
        id="primitives"
        number="02"
        title="UI primitives"
        description="Import these components directly. Usage examples include the existing props and defaults."
      >
        <ExampleGrid>
          <ButtonExample />
          <InputExample name={name} setName={setName} />
          <CardExample />
          <PageFrameExample />
          <FormExamples />
          <PosterExamples />
          <ReuseNotes />
        </ExampleGrid>
      </Section>
      <Section
        id="player"
        number="03"
        title="Shared session experience"
        description="Host and player share a presentation layer. These examples use local state only."
      >
        <SessionChromeExample name={name} />
        <ChallengeExample />
        <SessionExamples />
        <TeamChoicesExample />
        <PrivateMissionExample />
        <SlideshowExample />
        <LegacySlideshowExample />
        <LegacyPlayerExample />
        <LegacyHostExample />
        <SessionStatusExample />
        <PlayerAccessExample />
        <ParticipationExamples />
      </Section>
      <Section
        id="feedback"
        number="04"
        title="Feedback & states"
        description="Loading, empty, error, recovery and time-based examples. All retry actions run locally."
      >
        <FeedbackExamples />
      </Section>
      <HostExamples />
      <Section
        id="catalog"
        number="06"
        title="Component catalog"
        description="Every component module in src/components and src/features. Connected features include integration notes; their live workflows stay in their own routes."
      >
        <Catalog />
      </Section>
    </StyleguideShell>
  );
}
