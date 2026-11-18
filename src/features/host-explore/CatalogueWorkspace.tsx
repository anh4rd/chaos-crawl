import SessionFeedback from "../../components/session/SessionFeedback";
import type { CatalogTab, CatalogTask, LocationIdea } from "./types";
import { tasks, locations, routes } from "./catalogue";
import {
  communityTasksFromSubmissions,
  categoriesForTab,
  filterTasks,
  filterLocations,
  filterRoutes,
} from "./catalogueModel";
import { useExploreFavourites } from "./useExploreFavourites";
import { useExploreCommunity } from "./useExploreCommunity";
import { useExploreContribution } from "./useExploreContribution";
import { useExploreModeration } from "./useExploreModeration";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import HostWorkspace from "../host-workspace/HostWorkspace";
import "../../styles/HostPortal.css";
import "../../styles/HostPlanning.css";
import "../../styles/HostTheme.css";

import CatalogueView from "./CatalogueView";
import ChallengeContributionDialog from "./ChallengeContributionDialog";
import ChallengeContributionForm from "./ChallengeContributionForm";
export default function CatalogueWorkspace() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<CatalogTab>("tasks");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [queryError, setQueryError] = useState("");
  const [actionError, setActionError] = useState("");
  const [expandedRoutes, setExpandedRoutes] = useState<string[]>([]);
  const clearFeedback = useCallback(() => {
    setActionError("");
    setQueryError("");
  }, []);
  const { loadingFavourites, busyFavourite, isSaved, toggleFavourite } =
    useExploreFavourites({
      onQueryError: setQueryError,
      onActionStart: clearFeedback,
      onActionError: setActionError,
    });
  const { submissions, currentUserId, isPlatformAdmin, loadSubmissions } =
    useExploreCommunity(setQueryError);
  const {
    showCreateChallenge,
    openCreateChallenge,
    closeContribution,
    editingSubmission,
    submittingChallenge,
    challengeDraft,
    setChallengeDraft,
    submitChallenge,
    editCommunityChallenge,
  } = useExploreContribution({
    onActionStart: clearFeedback,
    onActionError: setActionError,
    loadSubmissions,
  });
  const { reviewingId, deleteCommunityChallenge, reviewSubmission } =
    useExploreModeration({
      isPlatformAdmin,
      onActionStart: clearFeedback,
      onActionError: setActionError,
      loadSubmissions,
    });
  const error = actionError || queryError;

  const communityTasks = useMemo(
    () => communityTasksFromSubmissions(submissions),
    [submissions],
  );
  const categories = useMemo(() => categoriesForTab(tab), [tab]);
  const visibleTasks = useMemo(
    () => filterTasks([...tasks, ...communityTasks], search, category),
    [search, category, communityTasks],
  );
  const visibleLocations = useMemo(
    () => filterLocations(locations, search, category),
    [search, category],
  );
  const visibleRoutes = useMemo(
    () => filterRoutes(routes, search, category),
    [search, category],
  );

  function addTaskToPlan(task: CatalogTask, kind: "main" | "side") {
    if (task.id.startsWith("community-")) {
      navigate(
        `/host/games/new?communityTask=${encodeURIComponent(task.id.slice("community-".length))}&challengeKind=${kind}`,
      );
      return;
    }
    navigate(
      `/host/games/new?exploreTask=${encodeURIComponent(JSON.stringify(task))}&challengeKind=${kind}`,
    );
  }

  function selectLocationIdea(location: LocationIdea) {
    navigate(`/host/games/new?venueIdea=${encodeURIComponent(location.id)}`);
  }

  function toggleRoute(id: string) {
    setExpandedRoutes((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  const pendingSubmissions = submissions.filter(
    (submission) => submission.status === "pending",
  );
  const mySubmissions = submissions.filter(
    (submission) =>
      submission.submitted_by === currentUserId &&
      submission.status !== "approved",
  );
  const itemCount =
    tab === "tasks"
      ? visibleTasks.length
      : tab === "locations"
        ? visibleLocations.length
        : visibleRoutes.length;

  const taskItems = visibleTasks.map((task) => {
    const communitySubmission = task.id.startsWith("community-")
      ? submissions.find(
          (submission) => submission.id === task.id.slice("community-".length),
        )
      : undefined;
    return {
      task,
      saved: isSaved("task", task.id),
      busy: busyFavourite === `task:${task.id}`,
      onToggleSaved: () => {
        void toggleFavourite("task", task.id, task);
      },
      onAdd: (kind: "main" | "side") => addTaskToPlan(task, kind),
      adminActions:
        isPlatformAdmin && communitySubmission
          ? {
              busy: reviewingId === communitySubmission.id,
              onEdit: () => editCommunityChallenge(communitySubmission),
              onDelete: () => {
                void deleteCommunityChallenge(communitySubmission);
              },
            }
          : undefined,
    };
  });
  const locationItems = visibleLocations.map((location) => ({
    location,
    saved: isSaved("venue", location.id),
    busy: busyFavourite === `venue:${location.id}`,
    onToggleSaved: () => {
      void toggleFavourite("venue", location.id, location);
    },
    onUse: () => selectLocationIdea(location),
  }));
  const routeItems = visibleRoutes.map((route) => ({
    route,
    saved: isSaved("route", route.id),
    busy: busyFavourite === `route:${route.id}`,
    expanded: expandedRoutes.includes(route.id),
    onToggleSaved: () => {
      void toggleFavourite("route", route.id, route);
    },
    onToggleExpanded: () => toggleRoute(route.id),
  }));
  const reviewItems = isPlatformAdmin
    ? pendingSubmissions.map((submission) => ({
        id: submission.id,
        itemType: submission.item_type,
        title: submission.title,
        description: submission.description,
        details:
          submission.item_type === "challenge"
            ? {
                kind: String(submission.payload.kind ?? "main"),
                minutes: String(submission.payload.minutes ?? 10),
                points: String(submission.payload.points ?? 20),
              }
            : undefined,
        submittedDate: new Date(submission.created_at).toLocaleDateString(),
        busy: reviewingId === submission.id,
        onApprove: () => {
          void reviewSubmission(submission, "approved");
        },
        onReject: () => {
          void reviewSubmission(submission, "rejected");
        },
      }))
    : [];
  const historyItems = mySubmissions.map((submission) => ({
    id: submission.id,
    title: submission.title,
    itemType: submission.item_type,
    status: submission.status,
    submittedDate: new Date(submission.created_at).toLocaleDateString(),
    reviewNote: submission.review_note,
  }));
  const dialog = showCreateChallenge ? (
    <ChallengeContributionDialog
      editing={Boolean(editingSubmission)}
      onClose={closeContribution}
      feedback={
        error ? (
          <SessionFeedback message={error} onDismiss={clearFeedback} />
        ) : undefined
      }
    >
      <ChallengeContributionForm
        draft={challengeDraft}
        editing={Boolean(editingSubmission)}
        busy={submittingChallenge}
        onDraftChange={(change) =>
          setChallengeDraft((draft) => ({ ...draft, ...change }))
        }
        onToggleTag={(tag, selected) =>
          setChallengeDraft((draft) => ({
            ...draft,
            tags: selected
              ? draft.tags.filter((item) => item !== tag)
              : [...draft.tags, tag],
          }))
        }
        onSubmit={(event) => {
          void submitChallenge(event);
        }}
        onCancel={closeContribution}
      />
    </ChallengeContributionDialog>
  ) : null;
  return (
    <HostWorkspace
      title="Explore the library"
      subtitle="Browse ideas, save inspiration and contribute challenges to the shared catalogue."
      showCreate
    >
      <CatalogueView
        filters={{
          tab,
          search,
          category,
          categories,
          counts: {
            tasks: tasks.length + communityTasks.length,
            locations: locations.length,
            routes: routes.length,
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
        historyItems={historyItems}
        itemCount={itemCount}
        loadingFavourites={loadingFavourites}
        error={showCreateChallenge ? "" : error}
        onCreate={openCreateChallenge}
        onClearFilters={() => {
          setSearch("");
          setCategory("all");
        }}
        dialog={dialog}
      />
    </HostWorkspace>
  );
}
