import { useId, useState } from "react";
import HostShell from "../../components/host/HostShell";
import Button from "../../components/ui/Button";
import ContentPanel from "../../components/ui/ContentPanel";
import CountBadge from "../../components/ui/CountBadge";
import EmptyState from "../../components/ui/EmptyState";
import FeedbackNotice from "../../components/ui/FeedbackNotice";
import Note from "../../components/ui/Note";
import PanelGrid from "../../components/ui/PanelGrid";
import PanelHeading from "../../components/ui/PanelHeading";
import TabList from "../../components/ui/TabList";
import { GameCard } from "../host-hub/GameCard";
import CohostDialog from "../host-hub/CohostDialog";
import HostDirectory from "../host-hub/HostDirectory";
import HostChallengesView from "../host-hub/HostChallengesView";
import { Example } from "./Example";

export default function HostFoundationExample() {
  const id = useId();
  const overviewId = `${id}-overview`;
  const gamesId = `${id}-games`;
  const panelId = `${id}-plans`;
  const [view, setView] = useState("home");
  const [empty, setEmpty] = useState(false);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState(false);
  const [notice, setNotice] = useState(
    "All workspace actions stay in this reference.",
  );
  const [cohostOpen, setCohostOpen] = useState(false);
  const [cohostEmail, setCohostEmail] = useState("");
  const [cohosts, setCohosts] = useState<{ user_id: string; email: string }[]>(
    [],
  );
  const game = {
    id: "local-plan",
    name: "Demo party",
    event_date: null,
    start_time: "18:00",
    end_time: "22:00",
    venue_name: "Demo venue",
    player_count: 8,
    status: "planned" as const,
  };
  return (
    <section
      id="host-foundation-demo"
      aria-label="Local host workspace furniture"
    >
      <Example
        title="Local host workspace furniture"
        source="shared workspace primitives + HostDirectory"
        code={
          '<TabList variant="workspace" label="Game list view">...</TabList>\n<FeedbackNotice tone="error" role="alert">...</FeedbackNotice>'
        }
      >
        <label>
          <input
            type="checkbox"
            checked={empty}
            onChange={(event) => setEmpty(event.target.checked)}
          />{" "}
          Empty workspace preview
        </label>
        <Button
          type="button"
          variant="text"
          fullWidth={false}
          onClick={() => setError((value) => !value)}
        >
          Toggle workspace feedback
        </Button>
        <div className="host-shell-preview">
          <HostShell
            contentAs="div"
            title="Local Host Hub"
            subtitle="Shared workspace furniture with local data."
            displayName="Demo Host"
            homeHref="/host"
            readOnlyPreview={preview}
            onSignOut={() => setNotice("Signed out locally.")}
            onCreate={() => setNotice("Create selected locally.")}
            onNavigate={() => {
              setNotice("Navigation stays in this reference.");
            }}
          >
            <div className="host-dashboard">
              {preview && (
                <ContentPanel as="div" variant="workspace-preview">
                  <div>
                    <strong>Viewing as Demo Host</strong>
                    <span>Read-only local preview.</span>
                  </div>
                  <Button
                    type="button"
                    variant="comic-secondary"
                    fullWidth={false}
                    onClick={() => setPreview(false)}
                  >
                    Return to local Host Hub
                  </Button>
                </ContentPanel>
              )}
              <FeedbackNotice
                tone={error ? "error" : "success"}
                role={error ? "alert" : "status"}
              >
                {error
                  ? "Preview connection failed. Try the local action again."
                  : "Local game plan saved."}
              </FeedbackNotice>
              <TabList label="Local game list view" variant="workspace">
                <Button
                  type="button"
                  role="tab"
                  id={overviewId}
                  aria-controls={panelId}
                  tabIndex={view === "home" ? 0 : -1}
                  aria-selected={view === "home"}
                  variant="workspace-tab"
                  fullWidth={false}
                  className={view === "home" ? "btn--workspace-selected" : ""}
                  onClick={() => setView("home")}
                >
                  Overview
                </Button>
                <Button
                  type="button"
                  role="tab"
                  id={gamesId}
                  aria-controls={panelId}
                  tabIndex={view === "games" ? 0 : -1}
                  aria-selected={view === "games"}
                  variant="workspace-tab"
                  fullWidth={false}
                  className={view === "games" ? "btn--workspace-selected" : ""}
                  onClick={() => setView("games")}
                >
                  {"Your games "}
                  <CountBadge variant="workspace">{empty ? 0 : 1}</CountBadge>
                </Button>
              </TabList>
              <section
                className="host-dashboard__section"
                id={panelId}
                role="tabpanel"
                aria-labelledby={view === "home" ? overviewId : gamesId}
                tabIndex={0}
              >
                <PanelHeading variant="workspace">
                  <div>
                    <h2>{view === "home" ? "Upcoming games" : "All plans"}</h2>
                    <p>Local card and empty-state examples.</p>
                  </div>
                  <Button
                    type="button"
                    variant="workspace-link"
                    fullWidth={false}
                    onClick={() => setView("games")}
                  >
                    View all →
                  </Button>
                </PanelHeading>
                {empty ? (
                  <EmptyState variant="workspace-panel">
                    <h3>No games yet</h3>
                    <p>Your local game plans will appear here.</p>
                  </EmptyState>
                ) : (
                  <PanelGrid variant="games">
                    <GameCard
                      game={game}
                      playing={false}
                      readOnly={preview}
                      onEdit={() => setNotice("Edit selected locally.")}
                      onPlay={() => setNotice("Play selected locally.")}
                      onManageCohosts={() => setCohostOpen(true)}
                    />
                  </PanelGrid>
                )}
              </section>
              {preview && (
                <HostChallengesView
                  data={{
                    liked: [
                      {
                        id: "local-liked",
                        title: "Photo hunt",
                        description: "Find a colourful landmark.",
                        source: "Saved challenge",
                        status: null,
                        details: { kind: "side", points: 10 },
                      },
                    ],
                    created: [
                      {
                        id: "local-created",
                        title: "Team entrance",
                        description: "Make an entrance together.",
                        source: "Custom challenge in game plan: Demo party",
                        status: null,
                        details: { kind: "main", minutes: 5 },
                      },
                    ],
                  }}
                />
              )}
              <HostDirectory
                className="host-dashboard__section"
                hosts={
                  empty
                    ? []
                    : [
                        {
                          host_id: "demo-host",
                          display_name: "Demo Host",
                          email: "demo@example.test",
                          created_at: "2020-01-01T12:00:00Z",
                          game_count: 1,
                        },
                      ]
                }
                onPreview={() => {
                  setPreview(true);
                  setNotice("Previewing Demo Host locally.");
                }}
              />
            </div>
          </HostShell>
        </div>
        {cohostOpen && (
          <CohostDialog
            gameName={game.name}
            email={cohostEmail}
            cohosts={cohosts}
            loading={false}
            busy={false}
            error=""
            canRetry={false}
            onEmailChange={setCohostEmail}
            onAdd={(event) => {
              event.preventDefault();
              const email = cohostEmail.trim();
              if (!email) return;
              setCohosts((current) =>
                current.some((cohost) => cohost.email === email)
                  ? current
                  : [...current, { user_id: email, email }],
              );
              setCohostEmail("");
            }}
            onRemove={(id) =>
              setCohosts((current) =>
                current.filter((cohost) => cohost.user_id !== id),
              )
            }
            onClose={() => setCohostOpen(false)}
            onDismissError={() => {}}
            onRetry={() => {}}
          />
        )}
        <Note as="output">{notice}</Note>
      </Example>
    </section>
  );
}
