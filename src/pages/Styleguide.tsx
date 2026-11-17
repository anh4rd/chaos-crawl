import { useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Check,
  Copy,
  Layers3,
  Search,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import DataError from "../components/ui/DataError";
import SessionMainChallengeCard from "../components/session/SessionMainChallengeCard";
import {
  SessionGameTitlebar,
  SessionPlayerProfile,
} from "../components/session/SessionGameChrome";
import GuidedTour from "../components/tour/GuidedTour";
import ScheduledCountdown from "../features/ScheduledCountdown";
import QueryPanel from "../features/admin/QueryPanel";
import ChallengeActions, {
  type ChallengeParticipation,
} from "../features/game/ChallengeActions";
import LiveTask from "../features/game/LiveTask";
import SideChallenges from "../features/game/SideChallenges";
import { componentCatalog } from "../features/styleguide/catalog";
import type { GameState } from "../types/database";
import "../styles/PlayerGame.css";
import "../styles/HostPortal.css";
import "../styles/HostTheme.css";
import "../styles/Styleguide.css";

const sections = [
  ["foundations", "01", "Foundations"],
  ["primitives", "02", "UI primitives"],
  ["player", "03", "Player components"],
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

function Section({
  id,
  number,
  title,
  description,
  children,
}: {
  id: string;
  number: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section
      id={`sg-${id}`}
      className="sg-section"
      aria-labelledby={`sg-${id}-title`}
    >
      <div className="sg-section-heading">
        <span>{number}</span>
        <div>
          <h2 id={`sg-${id}-title`}>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Example({
  title,
  source,
  code,
  children,
}: {
  title: string;
  source: string;
  code: string;
  children: ReactNode;
}) {
  const [copyStatus, setCopyStatus] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopyStatus("Copied");
    } catch {
      setCopyStatus("Select the code to copy manually.");
    }
  }
  return (
    <article className="sg-example">
      <header>
        <h3>{title}</h3>
        <code>{source}</code>
      </header>
      <div className="sg-preview">{children}</div>
      <details>
        <summary>Usage example</summary>
        <div className="sg-code-toolbar">
          <button type="button" onClick={() => void copy()}>
            <Copy size={14} /> Copy code
          </button>
          <span role="status">{copyStatus}</span>
        </div>
        <pre>
          <code>{code}</code>
        </pre>
      </details>
    </article>
  );
}

const demoGame: GameState = {
  id: 1,
  current_pub: "The starting line",
  current_challenge: "Strike a pose",
  challenge_description: "Get your whole team into one legendary photo.",
  current_challenge_id: 1,
  current_challenge_order: 1,
  voting_open: false,
  voting_target: "player",
  show_vote_results: false,
  slideshow_open: false,
  scheduled_challenge_id: null,
  scheduled_reveal_at: null,
};

function ParticipationExamples() {
  const [completed, setCompleted] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const participation: ChallengeParticipation = {
    fileInputRef,
    uploadingKey: null,
    completingKey: null,
    error: null,
    completionKey: (type, id) => `${type}:${id}`,
    hasCompleted: (type, id) => completed.includes(`${type}:${id}`),
    complete: async (type, id) => {
      setCompleted((current) => [...current, `${type}:${id}`]);
      setNotice("Demo challenge completed. No game data was changed.");
    },
    chooseUpload: () =>
      setNotice(
        "Photo / video upload selected. This demo does not upload files.",
      ),
    handleFileSelected: async () => {},
  };
  return (
    <>
      <Example
        title="ChallengeActions"
        source="src/features/game/ChallengeActions.tsx"
        code={
          '<ChallengeActions\n  challenge={{ id: 1, title: "Strike a pose", points: 20, type: "main" }}\n  allowMedia\n  participation={participation}\n/>\n// In a game, get participation from useChallengeParticipation.'
        }
      >
        <ChallengeActions
          challenge={{
            id: 2,
            title: "Strike a pose",
            points: 20,
            type: "main",
          }}
          allowMedia
          participation={participation}
        />
        <p role="status" className="sg-note">
          {notice || "Try the actions. Demo state stays on this page."}
        </p>
        <button
          type="button"
          className="sg-text-button"
          onClick={() => {
            setCompleted([]);
            setNotice("Demo reset.");
          }}
        >
          Reset demo
        </button>
      </Example>
      <div className="sg-grid">
        <Example
          title="LiveTask"
          source="src/features/game/LiveTask.tsx"
          code={
            "<LiveTask challenge={challenge} game={game} participation={participation} />\n// challenge: Challenge | undefined; game: GameState"
          }
        >
          <LiveTask
            challenge={{
              id: 1,
              pub_id: null,
              title: demoGame.current_challenge,
              description: demoGame.challenge_description,
              points: 20,
              reveal_order: 1,
              allow_photo_upload: true,
            }}
            game={demoGame}
            participation={participation}
          />
        </Example>
        <Example
          title="SideChallenges"
          source="src/features/game/SideChallenges.tsx"
          code={
            "<SideChallenges challenges={sideChallenges} participation={participation} />\n// challenges: SideChallenge[]; completed items are hidden."
          }
        >
          <SideChallenges
            challenges={[
              {
                id: 1,
                title: "Make a new friend",
                description: "Introduce your team to someone new.",
                points: 10,
                active: true,
              },
            ]}
            participation={participation}
          />
        </Example>
      </div>
    </>
  );
}

function FeedbackExamples() {
  const [failed, setFailed] = useState(true);
  const [tour, setTour] = useState(false);
  const [targetTime] = useState(() =>
    new Date(Date.now() + 5 * 60_000).toISOString(),
  );
  return (
    <>
      <div className="sg-grid">
        <Example
          title="QueryPanel"
          source="src/features/admin/QueryPanel.tsx"
          code={
            '<QueryPanel queries={[query]} loadingText="Loading challenges...">\n  <ChallengeList challenges={query.data} />\n</QueryPanel>\n// query supplies loading, error and async reload.'
          }
        >
          <div className="sg-state">
            <strong>Loading</strong>
            <QueryPanel
              queries={[{ loading: true, error: null, reload: async () => {} }]}
              loadingText="Loading challenges…"
            >
              <p>Challenge list</p>
            </QueryPanel>
          </div>
          <div className="sg-state">
            <strong>Loaded / empty</strong>
            <QueryPanel
              queries={[
                { loading: false, error: null, reload: async () => {} },
              ]}
              loadingText="Loading challenges…"
            >
              <p>No challenges yet. Add your first challenge to get started.</p>
            </QueryPanel>
          </div>
        </Example>
        <Example
          title="DataError"
          source="src/components/ui/DataError.tsx"
          code={
            '<DataError\n  error={new Error("Could not load the game.")}\n  retry={reload}\n/>\n// Page-level component: renders its own <main>.'
          }
        >
          {failed ? (
            <div role="region" aria-label="Error example">
              <DataError
                as="div"
                error={new Error("Demo: could not load the game.")}
                retry={async () => setFailed(false)}
              />
            </div>
          ) : (
            <div className="sg-state">
              <p role="status">Demo recovered successfully.</p>
              <button
                className="sg-text-button"
                type="button"
                onClick={() => setFailed(true)}
              >
                Show error again
              </button>
            </div>
          )}
        </Example>
        <Example
          title="ScheduledCountdown"
          source="src/features/ScheduledCountdown.tsx"
          code={
            "<ScheduledCountdown targetTime={scheduledRevealAt} />\n// ISO date string; null renders nothing."
          }
        >
          <p className="sg-timer">
            <ScheduledCountdown targetTime={targetTime} />
          </p>
          <p className="sg-note">
            Live countdown · five minutes from opening this page
          </p>
          <p>
            Expired: <ScheduledCountdown targetTime="2020-01-01T00:00:00Z" />
          </p>
        </Example>
        <Example
          title="GuidedTour"
          source="src/components/tour/GuidedTour.tsx"
          code={
            '<GuidedTour\n  steps={[{ target: "#tour-target", title: "Start here", body: "Your next step." }]}\n  onClose={() => setTourOpen(false)}\n/>'
          }
        >
          <Button fullWidth={false} type="button" onClick={() => setTour(true)}>
            Preview guided tour
          </Button>
          <p className="sg-note">
            Uses the real tour overlay and existing page targets.
          </p>
        </Example>
      </div>
      {tour && (
        <GuidedTour
          label="STYLEGUIDE TOUR"
          steps={[
            {
              target: "#sg-feedback-title",
              title: "Feedback that helps",
              body: "Reuse loading, retry and countdown components to keep game states consistent.",
            },
            {
              target: "#sg-catalog-title",
              title: "Find the source",
              body: "Search the catalog for component contracts, source paths and dependencies.",
            },
          ]}
          onClose={() => setTour(false)}
        />
      )}
    </>
  );
}

function Catalog() {
  const [search, setSearch] = useState("");
  const entries = componentCatalog.filter((entry) =>
    `${entry.name} ${entry.path} ${entry.group} ${entry.usage} ${entry.dependencies}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  return (
    <>
      <label className="sg-search">
        <Search size={19} />
        <span className="sg-sr-only">Search component catalog</span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search components, props or source paths…"
          type="search"
        />
      </label>
      <p className="sg-note" role="status">
        {entries.length} of {componentCatalog.length} component modules
      </p>
      <div className="sg-catalog">
        {entries.map((entry) => (
          <article key={entry.path}>
            <div>
              <span className="sg-tag">{entry.group}</span>
              <h3>{entry.name}</h3>
              <code>{entry.path}</code>
            </div>
            <div>
              <p>{entry.usage}</p>
              <p className="sg-note">{entry.dependencies}</p>
            </div>
          </article>
        ))}
      </div>
      {entries.length === 0 && (
        <div className="sg-empty">
          <Search size={28} />
          <p>No components match “{search}”.</p>
          <button
            className="sg-text-button"
            type="button"
            onClick={() => setSearch("")}
          >
            Clear search
          </button>
        </div>
      )}
    </>
  );
}

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
          <Sparkles size={23} />
          <span>
            CHAOS<span>CRAWL</span>
          </span>
        </Link>
        <span className="sg-topbar-label">DESIGN REFERENCE</span>
        <Link to="/">
          Open app <ArrowUpRight size={16} />
        </Link>
      </header>
      <div className="sg-layout">
        <aside className="sg-sidebar">
          <div className="sg-sidebar-label">
            <Layers3 size={16} /> THE TOOLKIT
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
                <Check size={15} /> Live component examples
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
              legacy Button uses Tailwind lime-300. These are existing values,
              not interchangeable tokens.
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
                  <Star aria-label="Star" />
                  <Trophy aria-label="Trophy" />
                  <Sparkles aria-label="Sparkles" />
                  <Copy aria-label="Copy" />
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
            title="Player components"
            description="The same components used in session games, styled by PlayerGame.css."
          >
            <Example
              title="SessionPlayerProfile + SessionGameTitlebar"
              source="src/components/session/SessionGameChrome.tsx"
              code={
                'import { SessionPlayerProfile, SessionGameTitlebar }\n  from "./components/session/SessionGameChrome";\nimport "./styles/PlayerGame.css";\n\n<SessionPlayerProfile viewerRole="player" name="Alex"\n  subtitle="Team Chaos" score={120} rank={2} />\n<SessionGameTitlebar name="Friday Night Chaos" code="123456"\n  copied={copied} onCopy={copyCode} />'
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
            <Sparkles size={18} />
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
