import type { CommunitySubmission, HostFavourite } from "../types/hostExplore";
import type {
  CatalogTab,
  CatalogTask,
  LocationIdea,
  RouteIdea,
  TaskKind,
} from "../features/host-explore/types";
import {
  tasks,
  locations,
  routes,
  CHALLENGE_TAG_OPTIONS,
} from "../features/host-explore/catalogue";
import {
  communityTasksFromSubmissions,
  categoriesForTab,
  filterTasks,
  filterLocations,
  filterRoutes,
} from "../features/host-explore/catalogueModel";
import {
  createChallengeDraft,
  draftFromSubmission,
  challengePayload,
} from "../features/host-explore/challengeDraft";
import Button from "../components/ui/Button";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import HostWorkspace from "../features/host-workspace/HostWorkspace";
import Icon from "../components/ui/Icon";
import { readHostIdentity } from "../lib/hostAuth";
import { readPlatformAdmin } from "../lib/hostHubQueries";
import { removeHostFavourite } from "../lib/hostSavedCommands";
import {
  readExploreFavourites,
  readCommunitySubmissions,
} from "../lib/hostExploreQueries";
import {
  saveExploreFavourite,
  createCommunityChallenge,
  updateApprovedCommunityChallenge,
  deleteApprovedCommunityChallenge,
  reviewPendingCommunitySubmission,
} from "../lib/hostExploreCommands";
import { favouriteData } from "../features/host-explore/favouriteData";
import "../styles/HostPortal.css";
import "../styles/HostPlanning.css";
import "../styles/HostTheme.css";

export default function HostExplore() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<CatalogTab>("tasks");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [favourites, setFavourites] = useState<HostFavourite[]>([]);
  const [loadingFavourites, setLoadingFavourites] = useState(true);
  const [busyFavourite, setBusyFavourite] = useState<string | null>(null);
  const [queryError, setQueryError] = useState("");
  const [actionError, setActionError] = useState("");
  const [expandedRoutes, setExpandedRoutes] = useState<string[]>([]);
  const [submissions, setSubmissions] = useState<CommunitySubmission[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [editingSubmission, setEditingSubmission] =
    useState<CommunitySubmission | null>(null);
  const [submittingChallenge, setSubmittingChallenge] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [challengeDraft, setChallengeDraft] = useState(createChallengeDraft);
  const mounted = useRef(false);
  const lifetime = useRef(0);
  const favouriteRead = useRef(0);
  const communityRead = useRef(0);
  const error = actionError || queryError;

  useEffect(() => {
    mounted.current = true;
    lifetime.current += 1;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadFavourites = useCallback(async () => {
    if (!mounted.current) return;
    const request = ++favouriteRead.current;
    const generation = lifetime.current;
    const current = () =>
      mounted.current &&
      lifetime.current === generation &&
      favouriteRead.current === request;
    setLoadingFavourites(true);
    const { data: userData, error: userError } = await readHostIdentity();
    if (!current()) return;
    if (userError || !userData.user) {
      setQueryError("Your session has expired. Please log in again.");
      setLoadingFavourites(false);
      return;
    }
    const { data, error: queryError } = await readExploreFavourites(
      userData.user.id,
    );
    if (!current()) return;
    setLoadingFavourites(false);
    if (queryError) {
      setQueryError(
        "Couldn't load your saved items. Check that the host planning migration has been run.",
      );
      return;
    }
    setFavourites(data ?? []);
  }, []);

  useEffect(() => {
    void loadFavourites();
  }, [loadFavourites]);

  const loadSubmissions = useCallback(async () => {
    if (!mounted.current) return;
    const request = ++communityRead.current;
    const generation = lifetime.current;
    const current = () =>
      mounted.current &&
      lifetime.current === generation &&
      communityRead.current === request;
    const [{ data: userData }, { data: adminData, error: adminError }] =
      await Promise.all([readHostIdentity(), readPlatformAdmin()]);
    if (!current()) return;
    if (adminError) {
      console.warn(
        "Platform-admin check unavailable; community review controls remain hidden.",
        adminError,
      );
    }
    setIsPlatformAdmin(Boolean(adminData));
    if (!userData.user) return;
    setCurrentUserId(userData.user.id);
    const { data, error: queryError } = await readCommunitySubmissions();
    if (!current()) return;
    if (queryError) {
      setQueryError(
        "Community submissions need the catalogue moderation migration. Run 20261112_community_catalog_and_host_view_as.sql in Supabase.",
      );
      return;
    }
    setSubmissions(data ?? []);
  }, []);

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions]);

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

  function isSaved(type: HostFavourite["item_type"], id: string) {
    return favourites.some(
      (item) => item.item_type === type && item.item_id === id,
    );
  }

  async function toggleFavourite(
    type: HostFavourite["item_type"],
    id: string,
    data: CatalogTask | LocationIdea | RouteIdea,
  ) {
    const generation = lifetime.current;
    const current = () => mounted.current && lifetime.current === generation;
    if (!current()) return;
    const key = `${type}:${id}`;
    setBusyFavourite(key);
    setActionError("");
    setQueryError("");
    const existing = favourites.find(
      (item) => item.item_type === type && item.item_id === id,
    );
    if (existing) {
      const { error: deleteError } = await removeHostFavourite({
        id: existing.id,
      });
      if (!current()) return;
      setBusyFavourite(null);
      if (deleteError) {
        setActionError(deleteError.message);
        return;
      }
      setFavourites((current) =>
        current.filter((item) => item.id !== existing.id),
      );
      return;
    }

    const { data: userData, error: userError } = await readHostIdentity();
    if (!current()) return;
    if (userError || !userData.user) {
      setBusyFavourite(null);
      setActionError("Your host session has expired. Please log in again.");
      return;
    }

    const { data: saved, error: saveError } = await saveExploreFavourite({
      hostId: userData.user.id,
      itemType: type,
      itemId: id,
      itemData: favouriteData(data),
    });
    if (!current()) return;
    setBusyFavourite(null);
    if (saveError) {
      setActionError(
        type === "route"
          ? "Route favourites need the latest host catalogue migration. Run 20261023_host_catalog_routes.sql in Supabase, then try again."
          : saveError.message,
      );
      return;
    }
    if (saved) setFavourites((current) => [...current, saved]);
  }

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

  async function submitChallenge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const generation = lifetime.current;
    const current = () => mounted.current && lifetime.current === generation;
    if (!current()) return;
    setSubmittingChallenge(true);
    setActionError("");
    setQueryError("");
    const { data: userData, error: userError } = await readHostIdentity();
    if (!current()) return;
    if (userError || !userData.user) {
      setActionError("Your session has expired. Please log in again.");
      setSubmittingChallenge(false);
      return;
    }
    const payload = challengePayload(challengeDraft);
    const { error: insertError } = editingSubmission
      ? await updateApprovedCommunityChallenge({
          id: editingSubmission.id,
          title: challengeDraft.title.trim(),
          description: challengeDraft.description.trim(),
          payload,
        })
      : await createCommunityChallenge({
          title: challengeDraft.title.trim(),
          description: challengeDraft.description.trim(),
          payload,
          submittedBy: userData.user.id,
        });
    if (!current()) return;
    setSubmittingChallenge(false);
    if (insertError) {
      setActionError(insertError.message);
      return;
    }
    setChallengeDraft(createChallengeDraft());
    setEditingSubmission(null);
    setShowCreateChallenge(false);
    await loadSubmissions();
  }

  function editCommunityChallenge(submission: CommunitySubmission) {
    setEditingSubmission(submission);
    setChallengeDraft(draftFromSubmission(submission));
    setShowCreateChallenge(true);
  }

  async function deleteCommunityChallenge(submission: CommunitySubmission) {
    const generation = lifetime.current;
    const current = () => mounted.current && lifetime.current === generation;
    if (!current()) return;
    if (
      !isPlatformAdmin ||
      !window.confirm(
        `Delete “${submission.title}” from the shared challenge library?`,
      )
    )
      return;
    setReviewingId(submission.id);
    setActionError("");
    setQueryError("");
    const { error: deleteError } = await deleteApprovedCommunityChallenge({
      id: submission.id,
    });
    if (!current()) return;
    setReviewingId(null);
    if (deleteError) {
      setActionError(deleteError.message);
      return;
    }
    await loadSubmissions();
  }

  async function reviewSubmission(
    submission: CommunitySubmission,
    status: "approved" | "rejected",
  ) {
    const generation = lifetime.current;
    const current = () => mounted.current && lifetime.current === generation;
    if (!current()) return;
    setReviewingId(submission.id);
    setActionError("");
    setQueryError("");
    const { data: userData, error: userError } = await readHostIdentity();
    if (!current()) return;
    if (userError || !userData.user || !isPlatformAdmin) {
      setActionError("Only a platform administrator can review submissions.");
      setReviewingId(null);
      return;
    }
    const { error: updateError } = await reviewPendingCommunitySubmission({
      id: submission.id,
      status,
      reviewedBy: userData.user.id,
      reviewedAt: new Date().toISOString(),
    });
    if (!current()) return;
    setReviewingId(null);
    if (updateError) {
      setActionError(updateError.message);
      return;
    }
    await loadSubmissions();
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

  return (
    <HostWorkspace
      title="Explore the library"
      subtitle="Browse ideas, save inspiration and contribute challenges to the shared catalogue."
      showCreate
    >
      <section className="host-explore-hero">
        <div className="host-explore-hero-copy">
          <span className="host-eyebrow host-eyebrow--light">
            YOUR NEXT GOOD BAD IDEA
          </span>
          <h2>Steal a little inspiration.</h2>
          <p>
            Browse ready-to-use tasks, places to host and route templates.
            Create your own challenges and submit them to the community library.
          </p>
        </div>
        <div className="host-explore-hero-art" aria-hidden="true">
          <Icon name="sparkles" className="icon--size-52" />
          <span>
            IDEAS
            <br />
            INSIDE
          </span>
        </div>
      </section>

      {error && (
        <div className="host-alert host-alert--error" role="alert">
          {error}
        </div>
      )}

      {isPlatformAdmin && pendingSubmissions.length > 0 && (
        <section className="host-community-review">
          <div className="host-community-section-heading">
            <div>
              <span className="host-community-kicker">
                <Icon name="shield-check" className="icon--size-14" /> PLATFORM
                MODERATION
              </span>
              <h2>
                Community review queue <span>{pendingSubmissions.length}</span>
              </h2>
              <p>
                Approve safe, clear contributions to publish them to every
                host's Explore library.
              </p>
            </div>
          </div>
          <div className="host-community-review-list">
            {pendingSubmissions.map((submission) => (
              <article
                className="host-community-review-card"
                key={submission.id}
              >
                <div>
                  <span className="host-community-type">
                    {submission.item_type}
                  </span>
                  <h3>{submission.title}</h3>
                  <p>{submission.description}</p>
                  {submission.item_type === "challenge" && (
                    <small>
                      {String(submission.payload.kind ?? "main")} ·{" "}
                      {String(submission.payload.minutes ?? 10)} min ·{" "}
                      {String(submission.payload.points ?? 20)} points
                    </small>
                  )}
                  <small>
                    Submitted{" "}
                    {new Date(submission.created_at).toLocaleDateString()}
                  </small>
                </div>
                <div className="host-community-review-actions">
                  <Button
                    type="button"
                    variant="comic-lime"
                    fullWidth={false}
                    disabled={reviewingId === submission.id}
                    onClick={() =>
                      void reviewSubmission(submission, "approved")
                    }
                  >
                    <Icon name="check-circle2" className="icon--size-15" />{" "}
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant="comic-secondary"
                    fullWidth={false}
                    disabled={reviewingId === submission.id}
                    onClick={() =>
                      void reviewSubmission(submission, "rejected")
                    }
                  >
                    <Icon name="x-circle" className="icon--size-15" /> Reject
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="host-explore-toolbar">
        <div
          className="host-explore-tabs"
          role="tablist"
          aria-label="Explore catalogue"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "tasks"}
            className={tab === "tasks" ? "is-active" : ""}
            onClick={() => {
              setTab("tasks");
              setCategory("all");
            }}
          >
            <Icon name="sparkles" className="icon--size-16" /> Tasks{" "}
            <span>{tasks.length + communityTasks.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "locations"}
            className={tab === "locations" ? "is-active" : ""}
            onClick={() => {
              setTab("locations");
              setCategory("all");
            }}
          >
            <Icon name="map-pin" className="icon--size-16" /> Locations{" "}
            <span>{locations.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "routes"}
            className={tab === "routes" ? "is-active" : ""}
            onClick={() => {
              setTab("routes");
              setCategory("all");
            }}
          >
            <Icon name="compass" className="icon--size-16" /> Routes{" "}
            <span>{routes.length}</span>
          </button>
        </div>
        <label className="host-explore-search">
          <Icon name="search" className="icon--size-17" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Search ${tab}…`}
            aria-label={`Search ${tab}`}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <Icon name="x" className="icon--size-15" />
            </button>
          )}
        </label>
      </div>

      <div className="host-explore-categories" aria-label="Filter catalogue">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            className={category === item ? "is-active" : ""}
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
          >
            {item === "all" ? "Everything" : item}
          </button>
        ))}
      </div>

      <div className="host-explore-results">
        <div className="host-explore-results-heading">
          <div>
            <h2>
              {tab === "tasks"
                ? "Ready-made challenges"
                : tab === "locations"
                  ? "Places to play"
                  : "Route templates"}
            </h2>
            <p>
              {tab === "tasks"
                ? "Browse the shared catalogue or submit an original challenge for review."
                : tab === "locations"
                  ? "Find a setting that fits your group, budget and energy."
                  : "Adapt these structures to your own city. They are templates, not verified mapped routes."}
            </p>
          </div>
          <div className="host-explore-heading-actions">
            <span>
              {itemCount} {itemCount === 1 ? "result" : "results"}
            </span>
            {tab === "tasks" && (
              <Button
                type="button"
                variant="comic-primary"
                fullWidth={false}
                onClick={() => setShowCreateChallenge(true)}
              >
                <Icon name="plus" className="icon--size-16" /> Create challenge
              </Button>
            )}
          </div>
        </div>

        {loadingFavourites && (
          <div className="host-explore-loading">Checking your saved items…</div>
        )}

        {tab === "tasks" && (
          <div className="host-explore-grid">
            {visibleTasks.map((task) => {
              const saved = isSaved("task", task.id);
              const communitySubmission = task.id.startsWith("community-")
                ? submissions.find(
                    (submission) =>
                      submission.id === task.id.slice("community-".length),
                  )
                : undefined;
              return (
                <article className="host-explore-card" key={task.id}>
                  <div className="host-explore-card-top">
                    <span
                      className={`host-explore-type host-explore-type--${task.kind}`}
                    >
                      {task.kind === "main"
                        ? "Main challenge"
                        : task.kind === "side"
                          ? "Side challenge"
                          : "Secret mission"}
                    </span>
                    <button
                      type="button"
                      className={`host-explore-save${saved ? " is-saved" : ""}`}
                      disabled={busyFavourite === `task:${task.id}`}
                      onClick={() =>
                        void toggleFavourite("task", task.id, task)
                      }
                      aria-label={
                        saved ? `Unsave ${task.title}` : `Save ${task.title}`
                      }
                      title={saved ? "Saved" : "Save for later"}
                    >
                      {saved ? (
                        <Icon name="bookmark-check" className="icon--size-18" />
                      ) : (
                        <Icon name="heart" className="icon--size-18" />
                      )}
                    </button>
                  </div>
                  <h3>{task.title}</h3>
                  <p>{task.description}</p>
                  <div className="host-explore-metadata">
                    {task.prepMinutes || task.performanceMinutes ? (
                      <>
                        <span>
                          <Icon name="clock3" className="icon--size-14" />
                          Prep {task.prepMinutes ?? 0} min
                        </span>
                        <span>
                          <Icon name="clock3" className="icon--size-14" />
                          Performance {task.performanceMinutes ?? 0} min
                        </span>
                      </>
                    ) : (
                      <span>
                        <Icon name="clock3" className="icon--size-14" />
                        {task.minutes} min
                      </span>
                    )}
                    <span>
                      <Icon name="sparkles" className="icon--size-14" />
                      {task.points} points
                    </span>
                    <span>
                      <Icon name="wallet" className="icon--size-14" />
                      {task.setup === "none"
                        ? "No kit"
                        : task.setup === "basic"
                          ? "Basic kit"
                          : "Some prep"}
                    </span>
                  </div>
                  <div className="host-explore-tags">
                    {task.tags.slice(0, 4).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  {isPlatformAdmin && communitySubmission && (
                    <div className="host-community-review-actions host-explore-admin-actions">
                      <Button
                        type="button"
                        variant="comic-secondary"
                        fullWidth={false}
                        onClick={() =>
                          editCommunityChallenge(communitySubmission)
                        }
                      >
                        Edit challenge
                      </Button>
                      <Button
                        type="button"
                        variant="comic-secondary"
                        fullWidth={false}
                        disabled={reviewingId === communitySubmission.id}
                        onClick={() =>
                          void deleteCommunityChallenge(communitySubmission)
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                  <div className="host-explore-use-options">
                    <Button
                      type="button"
                      variant="comic-primary"
                      fullWidth={false}
                      onClick={() => addTaskToPlan(task, "main")}
                    >
                      <PlusIcon /> Add as main
                    </Button>
                    <Button
                      type="button"
                      variant="comic-secondary"
                      fullWidth={false}
                      onClick={() => addTaskToPlan(task, "side")}
                    >
                      <PlusIcon /> Add as side
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {tab === "tasks" && mySubmissions.length > 0 && (
          <section className="host-my-submissions">
            <div className="host-community-section-heading">
              <div>
                <h3>Your submissions</h3>
                <p>
                  Approved challenges appear in the shared library. Pending
                  items are only visible to you and moderators.
                </p>
              </div>
            </div>
            <div className="host-my-submissions-list">
              {mySubmissions.map((submission) => (
                <div className="host-my-submission" key={submission.id}>
                  <div>
                    <strong>{submission.title}</strong>
                    <small>
                      {submission.item_type} · submitted{" "}
                      {new Date(submission.created_at).toLocaleDateString()}
                    </small>
                    {submission.review_note && (
                      <small>{submission.review_note}</small>
                    )}
                  </div>
                  <span
                    className={`host-submission-status host-submission-status--${submission.status}`}
                  >
                    {submission.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === "locations" && (
          <div className="host-explore-grid">
            {visibleLocations.map((location) => {
              const saved = isSaved("venue", location.id);
              return (
                <article className="host-explore-card" key={location.id}>
                  <div className="host-explore-card-top">
                    <span className="host-explore-type host-explore-type--location">
                      {location.oneVenue ? "Single venue" : "Outdoor idea"}
                    </span>
                    <button
                      type="button"
                      className={`host-explore-save${saved ? " is-saved" : ""}`}
                      disabled={busyFavourite === `venue:${location.id}`}
                      onClick={() =>
                        void toggleFavourite("venue", location.id, location)
                      }
                      aria-label={
                        saved
                          ? `Unsave ${location.title}`
                          : `Save ${location.title}`
                      }
                      title={saved ? "Saved" : "Save for later"}
                    >
                      {saved ? (
                        <Icon name="bookmark-check" className="icon--size-18" />
                      ) : (
                        <Icon name="heart" className="icon--size-18" />
                      )}
                    </button>
                  </div>
                  <h3>{location.title}</h3>
                  <p>{location.description}</p>
                  <div className="host-explore-metadata">
                    <span>
                      <Icon name="wallet" className="icon--size-14" />
                      {location.cost} cost
                    </span>
                    <span>
                      <Icon name="users" className="icon--size-14" />
                      {location.bestFor[0]}
                    </span>
                  </div>
                  <div className="host-explore-tags">
                    {location.bestFor.slice(0, 4).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <details className="host-explore-details">
                    <summary>Practical checks</summary>
                    <ul>
                      {location.considerations.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </details>
                  <Button
                    type="button"
                    variant="comic-primary"
                    fullWidth={false}
                    className="host-explore-use"
                    onClick={() => selectLocationIdea(location)}
                  >
                    Use this venue idea{" "}
                    <Icon name="arrow-right" className="icon--size-15" />
                  </Button>
                </article>
              );
            })}
          </div>
        )}

        {tab === "routes" && (
          <div className="host-explore-grid">
            {visibleRoutes.map((route) => {
              const saved = isSaved("route", route.id);
              const expanded = expandedRoutes.includes(route.id);
              return (
                <article
                  className="host-explore-card host-explore-route-card"
                  key={route.id}
                >
                  <div className="host-explore-card-top">
                    <span className="host-explore-type host-explore-type--route">
                      {route.style}
                    </span>
                    <button
                      type="button"
                      className={`host-explore-save${saved ? " is-saved" : ""}`}
                      disabled={busyFavourite === `route:${route.id}`}
                      onClick={() =>
                        void toggleFavourite("route", route.id, route)
                      }
                      aria-label={
                        saved ? `Unsave ${route.title}` : `Save ${route.title}`
                      }
                      title={saved ? "Saved" : "Save for later"}
                    >
                      {saved ? (
                        <Icon name="bookmark-check" className="icon--size-18" />
                      ) : (
                        <Icon name="heart" className="icon--size-18" />
                      )}
                    </button>
                  </div>
                  <h3>{route.title}</h3>
                  <p>{route.description}</p>
                  <div className="host-explore-metadata">
                    <span>
                      <Icon name="clock3" className="icon--size-14" />
                      {route.duration}
                    </span>
                    <span>
                      <Icon name="wallet" className="icon--size-14" />
                      {route.budget} budget
                    </span>
                    <span>
                      <Icon name="map-pin" className="icon--size-14" />
                      {route.stops.length} stops / stages
                    </span>
                  </div>
                  <div className="host-explore-tags">
                    {route.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="host-explore-route-toggle"
                    aria-expanded={expanded}
                    onClick={() => toggleRoute(route.id)}
                  >
                    {expanded ? "Hide route outline" : "Preview route"}{" "}
                    <Icon name="arrow-right" className="icon--size-15" />
                  </button>
                  {expanded && (
                    <div className="host-explore-route-outline">
                      <ol>
                        {route.stops.map((stop, index) => (
                          <li key={stop}>
                            <span>{index + 1}</span>
                            <div>
                              <strong>{stop}</strong>
                              <small>
                                Choose a suitable local place for this stage.
                              </small>
                            </div>
                          </li>
                        ))}
                      </ol>
                      <p>{route.note}</p>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="comic-secondary"
                    fullWidth={false}
                    className="host-explore-use"
                    onClick={() =>
                      void toggleFavourite("route", route.id, route)
                    }
                  >
                    {saved ? (
                      <>
                        <Icon name="check" className="icon--size-16" /> Saved
                        route
                      </>
                    ) : (
                      <>
                        <Icon name="heart" className="icon--size-16" /> Save
                        route
                      </>
                    )}
                  </Button>
                </article>
              );
            })}
          </div>
        )}

        {!itemCount && (
          <div className="host-empty-state">
            <Icon name="search" className="icon--size-24" />
            <h3>No matches</h3>
            <p>Try a different search or clear your filters.</p>
            <Button
              type="button"
              variant="comic-secondary"
              fullWidth={false}
              onClick={() => {
                setSearch("");
                setCategory("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {showCreateChallenge && (
        <div
          className="host-community-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget)
              setShowCreateChallenge(false);
          }}
        >
          <section
            className="host-community-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="host-create-challenge-title"
          >
            <div className="host-community-modal-heading">
              <div>
                <span className="host-community-kicker">
                  {editingSubmission
                    ? "PLATFORM ADMIN"
                    : "COMMUNITY CONTRIBUTION"}
                </span>
                <h2 id="host-create-challenge-title">
                  {editingSubmission ? "Edit challenge" : "Create a challenge"}
                </h2>
                <p>
                  {editingSubmission
                    ? "Update this approved challenge in the shared Explore library."
                    : "Share an original idea. It will be checked before appearing in Explore for other hosts."}
                </p>
              </div>
              <button
                type="button"
                className="host-explore-save"
                onClick={() => {
                  setShowCreateChallenge(false);
                  setEditingSubmission(null);
                }}
                aria-label="Close"
              >
                <Icon name="x" className="icon--size-18" />
              </button>
            </div>
            <form
              className="host-community-form"
              onSubmit={(event) => void submitChallenge(event)}
            >
              <label>
                <span>Challenge title</span>
                <input
                  required
                  maxLength={80}
                  value={challengeDraft.title}
                  onChange={(event) =>
                    setChallengeDraft((draft) => ({
                      ...draft,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Give it a memorable name"
                />
              </label>
              <label>
                <span>How does it work?</span>
                <textarea
                  required
                  maxLength={1200}
                  rows={4}
                  value={challengeDraft.description}
                  onChange={(event) =>
                    setChallengeDraft((draft) => ({
                      ...draft,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Explain the challenge and any rules or safety considerations."
                />
              </label>
              <div className="host-community-form-grid">
                <label>
                  <span>Challenge type</span>
                  <select
                    value={challengeDraft.kind}
                    onChange={(event) =>
                      setChallengeDraft((draft) => ({
                        ...draft,
                        kind: event.target.value as TaskKind,
                      }))
                    }
                  >
                    <option value="main">Main challenge</option>
                    <option value="side">Side challenge</option>
                    <option value="secret">Secret mission</option>
                  </select>
                </label>
                <label>
                  <span>Points</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={challengeDraft.points}
                    onChange={(event) =>
                      setChallengeDraft((draft) => ({
                        ...draft,
                        points: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Minutes</span>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={challengeDraft.minutes}
                    onChange={(event) =>
                      setChallengeDraft((draft) => ({
                        ...draft,
                        minutes: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Player prep (optional)</span>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={challengeDraft.prepMinutes ?? 0}
                    onChange={(event) =>
                      setChallengeDraft((draft) => ({
                        ...draft,
                        prepMinutes: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Player performance (optional)</span>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={challengeDraft.performanceMinutes ?? 0}
                    onChange={(event) =>
                      setChallengeDraft((draft) => ({
                        ...draft,
                        performanceMinutes: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Equipment</span>
                  <select
                    value={challengeDraft.setup}
                    onChange={(event) =>
                      setChallengeDraft((draft) => ({
                        ...draft,
                        setup: event.target.value as CatalogTask["setup"],
                      }))
                    }
                  >
                    <option value="none">No kit</option>
                    <option value="basic">Basic kit</option>
                    <option value="some">Some prep</option>
                  </select>
                </label>
              </div>
              <fieldset className="host-community-tag-fieldset">
                <legend>
                  Tags{" "}
                  <small>Choose up to 8 that describe your challenge</small>
                </legend>
                <div className="host-community-tag-options">
                  {CHALLENGE_TAG_OPTIONS.map((tag) => {
                    const selected = challengeDraft.tags.includes(tag);
                    const disabled =
                      !selected && challengeDraft.tags.length >= 8;
                    return (
                      <button
                        key={tag}
                        type="button"
                        className={`host-community-tag-option${selected ? " is-selected" : ""}`}
                        aria-pressed={selected}
                        disabled={disabled}
                        onClick={() =>
                          setChallengeDraft((draft) => ({
                            ...draft,
                            tags: selected
                              ? draft.tags.filter((item) => item !== tag)
                              : [...draft.tags, tag],
                          }))
                        }
                      >
                        {selected ? (
                          <Icon name="check" className="icon--size-13" />
                        ) : (
                          <PlusIcon />
                        )}
                        {tag}
                      </button>
                    );
                  })}
                </div>
                <small className="host-community-tag-count">
                  {challengeDraft.tags.length}/8 selected
                </small>
              </fieldset>
              {!editingSubmission && (
                <div className="host-community-submit-note">
                  <Icon name="shield-check" className="icon--size-16" />
                  <span>
                    Submissions are private until approved by the Chaos Crawl
                    team. Approved challenges become visible to all hosts.
                  </span>
                </div>
              )}
              <div className="host-community-modal-actions">
                <Button
                  type="button"
                  variant="comic-secondary"
                  fullWidth={false}
                  onClick={() => {
                    setShowCreateChallenge(false);
                    setEditingSubmission(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="comic-primary"
                  fullWidth={false}
                  disabled={submittingChallenge}
                >
                  {submittingChallenge ? (
                    editingSubmission ? (
                      "Saving…"
                    ) : (
                      "Submitting…"
                    )
                  ) : editingSubmission ? (
                    <>
                      <Icon name="check" className="icon--size-15" /> Save
                      changes
                    </>
                  ) : (
                    <>
                      <Icon name="send" className="icon--size-15" /> Submit for
                      review
                    </>
                  )}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </HostWorkspace>
  );
}

function PlusIcon() {
  return (
    <span aria-hidden="true" className="host-explore-plus">
      +
    </span>
  );
}
