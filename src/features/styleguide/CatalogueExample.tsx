import SessionFeedback from "../../components/session/SessionFeedback";
import { useState } from "react";
import CatalogueView from "../host-explore/CatalogueView";
import ChallengeContributionDialog from "../host-explore/ChallengeContributionDialog";
import ChallengeContributionForm from "../host-explore/ChallengeContributionForm";
import GameSelectionDialog from "../host-explore/GameSelectionDialog";
import Button from "../../components/ui/Button";
import { tasks, locations, routes } from "../host-explore/catalogue";
import {
  categoriesForTab,
  filterTasks,
  filterLocations,
  filterRoutes,
} from "../host-explore/catalogueModel";
import { createChallengeDraft } from "../host-explore/challengeDraft";
import type { CatalogTab, CatalogTask } from "../host-explore/types";
import { Example } from "./Example";
import HostPatternPreview from "./HostPatternPreview";

const sampleTasks = tasks.slice(0, 2),
  sampleLocations = locations.slice(0, 1),
  sampleRoutes = routes.slice(0, 1);
export default function CatalogueExample() {
  const [tab, setTab] = useState<CatalogTab>("tasks");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [saved, setSaved] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [admin, setAdmin] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(createChallengeDraft);
  const [notice, setNotice] = useState("");
  const [choosingGame, setChoosingGame] = useState(false);
  function toggleSaved(id: string) {
    setSaved((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }
  function close() {
    setOpen(false);
    setEditing(false);
  }
  function edit(task: CatalogTask) {
    setDraft({
      ...task,
      prepMinutes: task.prepMinutes ?? 0,
      performanceMinutes: task.performanceMinutes ?? 0,
    });
    setEditing(true);
    setOpen(true);
  }
  const taskItems = filterTasks(sampleTasks, search, category).map((task) => ({
    task,
    saved: saved.includes(task.id),
    busy,
    onToggleSaved: () => toggleSaved(task.id),
    onAdd: (kind: CatalogTask["kind"]) =>
      setNotice(`Selected ${task.title} as ${kind} locally.`),
    adminActions: admin
      ? {
          busy,
          onEdit: () => edit(task),
          onDelete: () => setNotice("Delete selected locally."),
        }
      : undefined,
  }));
  const locationItems = filterLocations(sampleLocations, search, category).map(
    (location) => ({
      location,
      saved: saved.includes(location.id),
      busy,
      onToggleSaved: () => toggleSaved(location.id),
      onUse: () => setNotice("Venue selected locally."),
    }),
  );
  const routeItems = filterRoutes(sampleRoutes, search, category).map(
    (route) => ({
      route,
      saved: saved.includes(route.id),
      busy,
      expanded: expanded.includes(route.id),
      onToggleSaved: () => toggleSaved(route.id),
      onToggleExpanded: () =>
        setExpanded((current) =>
          current.includes(route.id)
            ? current.filter((id) => id !== route.id)
            : [...current, route.id],
        ),
    }),
  );
  const reviewItems =
    admin && !reviewed
      ? [
          {
            id: "local-review",
            itemType: "challenge",
            title: "Local pending contribution",
            description: "This queue only changes local state.",
            details: { kind: "main", minutes: "10", points: "20" },
            submittedDate: "1 Jan 2030",
            busy,
            onApprove: () => {
              setReviewed(true);
              setNotice("Contribution approved locally.");
            },
            onReject: () => {
              setReviewed(true);
              setNotice("Contribution rejected locally.");
            },
          },
        ]
      : [];
  const dialog = open ? (
    <ChallengeContributionDialog
      editing={editing}
      onClose={close}
      feedback={
        error ? (
          <SessionFeedback
            message="Local catalogue error"
            onDismiss={() => setError(false)}
          />
        ) : undefined
      }
    >
      <ChallengeContributionForm
        draft={draft}
        editing={editing}
        busy={busy}
        onDraftChange={(change) =>
          setDraft((current) => ({ ...current, ...change }))
        }
        onToggleTag={(tag, selected) =>
          setDraft((current) => ({
            ...current,
            tags: selected
              ? current.tags.filter((value) => value !== tag)
              : [...current.tags, tag],
          }))
        }
        onSubmit={(event) => {
          event.preventDefault();
          setNotice("Contribution saved locally.");
          close();
        }}
        onCancel={close}
      />
    </ChallengeContributionDialog>
  ) : null;
  const itemCount =
    tab === "tasks"
      ? taskItems.length
      : tab === "locations"
        ? locationItems.length
        : routeItems.length;
  return (
    <Example
      title="Local catalogue"
      source="src/features/host-explore/CatalogueView.tsx"
      code={"<CatalogueView {...presentationModelsAndCallbacks} />"}
    >
      <label>
        <input
          type="checkbox"
          checked={admin}
          onChange={(event) => setAdmin(event.target.checked)}
        />{" "}
        Show catalogue moderation
      </label>
      <label>
        <input
          type="checkbox"
          checked={busy}
          onChange={(event) => setBusy(event.target.checked)}
        />{" "}
        Simulate catalogue action pending
      </label>
      <label>
        <input
          type="checkbox"
          checked={loading}
          onChange={(event) => setLoading(event.target.checked)}
        />{" "}
        Simulate catalogue loading
      </label>
      <label>
        <input
          type="checkbox"
          checked={error}
          onChange={(event) => setError(event.target.checked)}
        />{" "}
        Simulate catalogue error
      </label>
      <HostPatternPreview>
        <CatalogueView
          filters={{
            tab,
            search,
            category,
            categories: categoriesForTab(tab),
            counts: {
              tasks: sampleTasks.length,
              locations: sampleLocations.length,
              routes: sampleRoutes.length,
            },
            onTabChange: (next) => {
              setTab(next);
              setCategory("all");
            },
            onSearchChange: setSearch,
            onCategoryChange: setCategory,
          }}
          tasks={taskItems}
          locations={locationItems}
          routes={routeItems}
          reviewItems={reviewItems}
          historyItems={[
            {
              id: "local-history",
              title: "Local submitted idea",
              itemType: "challenge",
              submittedDate: "1 Jan 2030",
              status: "pending",
              reviewNote: "Visible only in this local reference.",
            },
          ]}
          itemCount={itemCount}
          loadingFavourites={loading}
          error={error && !open ? "Local catalogue error" : ""}
          onCreate={() => {
            setEditing(false);
            setOpen(true);
          }}
          onClearFilters={() => {
            setSearch("");
            setCategory("all");
          }}
          dialog={dialog}
        />
      </HostPatternPreview>
      <Button
        type="button"
        variant="comic-secondary"
        fullWidth={false}
        onClick={() => setChoosingGame(true)}
      >
        Preview game selection
      </Button>
      {choosingGame && (
        <GameSelectionDialog
          games={[
            { id: "local-one", name: "Local party", status: "draft" },
            { id: "local-two", name: "Local crawl", status: "planned" },
          ]}
          loading={false}
          saving={false}
          error=""
          onChoose={(game) => {
            setNotice(`Selected ${game.name} locally.`);
            setChoosingGame(false);
          }}
          onCreate={() => setNotice("Create game selected locally.")}
          onRetry={() => setNotice("Retry selected locally.")}
          onClose={() => setChoosingGame(false)}
        />
      )}
      <p role="status">{notice}</p>
    </Example>
  );
}
