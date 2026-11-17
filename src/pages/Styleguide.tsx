import SessionExamples from "../features/styleguide/SessionExamples";
import Icon from "../components/ui/Icon";
import FormExamples from "../features/styleguide/FormExamples";

import { useState } from "react";
import { Link } from "react-router-dom";
import { SessionGameTitlebar } from "../components/session/SessionGameTitlebar";
import SessionMainChallengeCard from "../components/session/SessionMainChallengeCard";
import { SessionPlayerProfile } from "../components/session/SessionPlayerProfile";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import { Catalog } from "../features/styleguide/Catalog";
import { Example } from "../features/styleguide/Example";
import { FeedbackExamples } from "../features/styleguide/FeedbackExamples";
import { ParticipationExamples } from "../features/styleguide/ParticipationExamples";
import { Section } from "../features/styleguide/Section";
import { componentCatalog } from "../features/styleguide/catalog";
import "../styles/PlayerGame.css";
import "../styles/HostPortal.css";
import "../styles/HostTheme.css";
import "../styles/Styleguide.css";

const sections = [
  ["foundations", "01", "Foundations"],
  ["primitives", "02", "UI primitives"],
  ["player", "03", "Shared sessions"],
  ["feedback", "04", "Feedback & states"],
  ["host", "05", "Host patterns"],
  ["catalog", "06", "Component catalog"],
] as const;

const colors = [
  ["Purple", "--purple", "#5c36fb"],
  ["Purple mid", "--purple-mid", "#7554fc"],
  ["Purple dark", "--purple-dark", "#23166e"],
  ["Pink", "--pink", "#fb377a"],
  ["Lime", "--lime", "#e5ff00"],
  ["Yellow", "--yellow", "#ffe600"],
  ["Ink", "--black", "#060f13"],
  ["White", "--white", "#ffffff"],
];

export default function Styleguide() {
  const [name, setName] = useState("Team Chaos");
  const [pressed, setPressed] = useState(false);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyNotice, setCopyNotice] = useState("");
  const [hostNotice, setHostNotice] = useState("");
  async function copyGameCode() {
    try {
      await navigator.clipboard.writeText("123456");
      setCopied(true);
      setCopyNotice("Demo game code copied.");
    } catch {
      setCopied(false);
      setCopyNotice("Copy the demo code manually: 123456.");
    }
  }
  function jump(id: string) {
    document.getElementById(`sg-${id}`)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  }
  return (
    <div className="sg-page">
      <a
        className="sg-skip"
        href="#/styleguide"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("sg-content")?.focus();
        }}
      >
        Skip to components
      </a>
      <header className="sg-topbar">
        <Link to="/" className="sg-brand">
          <Icon name="sparkles" className="icon--size-23" />
          <span>
            CHAOS<span>CRAWL</span>
          </span>
        </Link>
        <span className="sg-topbar-label">DESIGN REFERENCE</span>
        <Link to="/">
          Open app <Icon name="arrow-up-right" className="icon--size-16" />
        </Link>
      </header>
      <div className="sg-layout">
        <aside className="sg-sidebar">
          <div className="sg-sidebar-label">
            <Icon name="layers3" className="icon--size-16" /> THE TOOLKIT
          </div>
          <nav aria-label="Styleguide sections">
            {sections.map(([id, number, title]) => (
              <button type="button" key={id} onClick={() => jump(id)}>
                <span>{number}</span>
                {title}
              </button>
            ))}
          </nav>
          <p>
            Real components.
            <br />
            Shared foundations.
            <br />A little more chaos.
          </p>
          <span className="sg-tag">
            {componentCatalog.length} component modules
          </span>
        </aside>
        <main id="sg-content" className="sg-main" tabIndex={-1}>
          <div className="sg-hero">
            <span className="sg-eyebrow">THE CHAOS CRAWL STYLEGUIDE</span>
            <h1>
              Build on
              <br />
              <span>the good stuff.</span>
            </h1>
            <p>
              One place for our colors, components and patterns. Start here,
              reuse what exists, and keep every game feeling like Chaos Crawl.
            </p>
            <div>
              <span className="sg-hero-pill">
                <Icon name="check" className="icon--size-15" /> Live component
                examples
              </span>
              <span className="sg-hero-pill">Local demo data</span>
            </div>
          </div>
          <Section
            id="foundations"
            number="01"
            title="Foundations"
            description="The existing palette and typography, straight from Globals.css."
          >
            <div className="sg-colors">
              {colors.map(([label, token, hex]) => (
                <div className="sg-swatch" key={token}>
                  <div style={{ backgroundColor: `var(${token})` }} />
                  <strong>{label}</strong>
                  <code>{token}</code>
                  <small>{hex}</small>
                </div>
              ))}
            </div>
            <p className="sg-note">
              Player and host screens also use #d3fb6e for lime accents; the
              Button retains the original lime-300 value through an SCSS token.
              These are existing values, not interchangeable tokens.
            </p>
            <div className="sg-grid sg-foundation-grid">
              <div className="sg-foundation">
                <span className="sg-eyebrow">DISPLAY / HARDBEAT</span>
                <p className="sg-type-display">Bring the chaos</p>
                <p>
                  Use for short, expressive headings. Font files live in
                  public/fonts.
                </p>
              </div>
              <div className="sg-foundation">
                <span className="sg-eyebrow">BODY / QUICKSAND</span>
                <p className="sg-type-body">
                  Good games start with clear instructions.
                </p>
                <p>
                  Regular body copy with bold labels. The global font stack
                  includes system fallbacks.
                </p>
                <div className="sg-icon-row" aria-label="Lucide icon examples">
                  <Icon
                    name="star"
                    className="icon--size-24"
                    aria-label="Star"
                  />
                  <Icon
                    name="trophy"
                    className="icon--size-24"
                    aria-label="Trophy"
                  />
                  <Icon
                    name="sparkles"
                    className="icon--size-24"
                    aria-label="Sparkles"
                  />
                  <Icon
                    name="copy"
                    className="icon--size-24"
                    aria-label="Copy"
                  />
                  <span>lucide-react · label icon-only actions</span>
                </div>
              </div>
            </div>
          </Section>
          <Section
            id="primitives"
            number="02"
            title="UI primitives"
            description="Import these components directly. Usage examples include the existing props and defaults."
          >
            <div className="sg-grid">
              <Example
                title="Button"
                source="src/components/ui/Button.tsx"
                code={
                  'import Button from "./components/ui/Button";\n\n<Button type="button" fullWidth={false} onClick={onStart}>\n  Start game\n</Button>\n<Button type="button" disabled>Saving...</Button>'
                }
              >
                <div className="sg-button-row">
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
                </div>
                <p className="sg-note">
                  Full width by default · native disabled and click props
                </p>
                <p role="status">
                  {pressed
                    ? "Demo action selected."
                    : "Try the primary action."}
                </p>
              </Example>
              <Example
                title="Input"
                source="src/components/ui/Input.tsx"
                code={
                  'import Input from "./components/ui/Input";\n\n<label htmlFor="team-name">Team name</label>\n<Input id="team-name" value={name}\n  onChange={(event) => setName(event.target.value)} />'
                }
              >
                <label htmlFor="sg-team-name" className="sg-field-label">
                  Team name
                </label>
                <Input
                  id="sg-team-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
                <label htmlFor="sg-disabled-field" className="sg-field-label">
                  Disabled field
                </label>
                <Input
                  id="sg-disabled-field"
                  disabled
                  placeholder="Waiting for the host"
                />
                <p className="sg-note">
                  Always pair an input with a visible label.
                </p>
              </Example>
              <Example
                title="Card"
                source="src/components/ui/Card.tsx"
                code={
                  'import Card from "./components/ui/Card";\n\n<Card>\n  <h2>Your next adventure</h2>\n  <p>Compose the content you need.</p>\n</Card>'
                }
              >
                <Card>
                  <h2>Your next adventure</h2>
                  <p className="mt-3">
                    A shared surface for tasks, forms and game details.
                  </p>
                  <p className="mt-3 font-bold">
                    Children + optional className
                  </p>
                </Card>
              </Example>
              <FormExamples />
              <div className="sg-foundation">
                <span className="sg-eyebrow">REUSE NOTES</span>
                <h3>Compose first.</h3>
                <p>
                  Use Button, Input and Card for the existing legacy UI. Use the
                  shared session components for player screens and the host CSS
                  patterns for host screens.
                </p>
                <p>
                  The host buttons are CSS classes, not variants of the Button
                  component. Keep their context when reusing them.
                </p>
                <p>
                  Source paths are relative to the repository root. Adjust
                  import paths to the consuming file.
                </p>
              </div>
            </div>
          </Section>
          <Section
            id="player"
            number="03"
            title="Shared session experience"
            description="Host and player share a presentation layer. These examples use local state only."
          >
            <Example
              title="SessionPlayerProfile + SessionGameTitlebar"
              source="src/components/session/SessionPlayerProfile.tsx"
              code={
                'import { SessionPlayerProfile } from "./components/session/SessionPlayerProfile";\nimport { SessionGameTitlebar } from "./components/session/SessionGameTitlebar";\n\n<SessionPlayerProfile viewerRole="player" name="Alex"\n  subtitle="Team Chaos" score={120} rank={2} />\n<SessionGameTitlebar name="Friday Night Chaos" code="123456"\n  copied={copied} onCopy={copyCode} />'
              }
            >
              <div className="sg-player-chrome">
                <SessionPlayerProfile
                  viewerRole="player"
                  name="Alex"
                  subtitle={name || "Team Chaos"}
                  score={120}
                  rank={2}
                />
                <SessionGameTitlebar
                  name="Friday Night Chaos"
                  code="123456"
                  copied={copied}
                  onCopy={() => void copyGameCode()}
                />
              </div>
              <p className="sg-note" role="status">
                {copyNotice ||
                  "Edit the team name above to update this profile."}
              </p>
            </Example>
            <Example
              title="SessionMainChallengeCard"
              source="src/components/session/SessionMainChallengeCard.tsx"
              code={
                '<SessionMainChallengeCard viewerRole="player"\n  title="Strike a pose" description="Get your whole team into one photo."\n  points={20} round={1} roundCount={4} durationMinutes={5}\n  timerLabel="04:32" timerCaption="TIME LEFT"\n  action={<Button type="button" onClick={onComplete}>Mark done</Button>}\n/>'
              }
            >
              <SessionMainChallengeCard
                viewerRole="player"
                title="Strike a pose"
                description="Get your whole team into one legendary photo."
                points={20}
                round={1}
                roundCount={4}
                durationMinutes={5}
                timerLabel="04:32"
                timerCaption="TIME LEFT"
                action={
                  <Button
                    type="button"
                    fullWidth={false}
                    onClick={() => setChallengeCompleted((value) => !value)}
                  >
                    {challengeCompleted ? "✓ Completed" : "Mark done"}
                  </Button>
                }
              />
              <p className="sg-note">
                Static timer label · use ScheduledCountdown when a live
                countdown is needed.
              </p>
            </Example>
            <SessionExamples />
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
          <Section
            id="host"
            number="05"
            title="Host patterns"
            description="Existing CSS patterns from HostPortal.css and HostTheme.css. These are not exported React components."
          >
            <Example
              title="Host action styles"
              source="src/styles/HostPortal.css + HostTheme.css"
              code={
                '<div className="host-portal host-app">\n  <button type="button" className="host-button host-button--primary">Create game</button>\n  <button type="button" className="host-button host-button--secondary">Cancel</button>\n  <button type="button" className="host-button host-button--lime">Go live</button>\n</div>\n// Import both HostPortal.css and HostTheme.css.'
              }
            >
              <div className="host-portal host-app sg-host-pattern">
                <div className="sg-button-row">
                  {[
                    ["primary", "Create game"],
                    ["secondary", "Cancel"],
                    ["lime", "Go live"],
                  ].map(([variant, label]) => (
                    <button
                      type="button"
                      key={variant}
                      className={`host-button host-button--${variant}`}
                      onClick={() =>
                        setHostNotice(`${label} selected in the demo.`)
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="sg-note" role="status">
                {hostNotice || "Try each host action style."}
              </p>
            </Example>
            <p className="sg-note">
              HostShell supplies the full authenticated layout. The catalog
              documents the host panels and their data dependencies.
            </p>
          </Section>
          <Section
            id="catalog"
            number="06"
            title="Component catalog"
            description="Every component module in src/components and src/features. Connected features include integration notes; their live workflows stay in their own routes."
          >
            <Catalog />
          </Section>
          <footer className="sg-footer">
            <Icon name="sparkles" className="icon--size-18" />
            <p>
              Keep this reference useful: reuse the source components and update
              their examples when contracts change. New component modules appear
              in the catalog automatically.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
