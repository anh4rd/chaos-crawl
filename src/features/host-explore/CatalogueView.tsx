import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import CatalogueFilters from "./CatalogueFilters";
import TaskCard from "./TaskCard";
import LocationCard from "./LocationCard";
import RouteCard from "./RouteCard";
import CommunityReviewQueue from "./CommunityReviewQueue";
import SubmissionHistory from "./SubmissionHistory";
import type { CatalogueViewModel } from "./viewTypes";

export default function CatalogueView({
  filters,
  tasks,
  locations,
  routes,
  reviewItems,
  historyItems,
  itemCount,
  loadingFavourites,
  error,
  onCreate,
  onClearFilters,
  dialog,
}: CatalogueViewModel) {
  const { tab } = filters;
  let heading = "Route templates";
  let description =
    "Adapt these structures to your own city. They are templates, not verified mapped routes.";
  if (tab === "tasks") {
    heading = "Ready-made challenges";
    description =
      "Browse the shared catalogue or submit an original challenge for review.";
  } else if (tab === "locations") {
    heading = "Places to play";
    description = "Find a setting that fits your group, budget and energy.";
  }
  return (
    <>
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
      {reviewItems.length > 0 && <CommunityReviewQueue items={reviewItems} />}
      <CatalogueFilters {...filters} />
      <div className="host-explore-results">
        <div className="host-explore-results-heading">
          <div>
            <h2>{heading}</h2>
            <p>{description}</p>
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
                onClick={onCreate}
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
            {tasks.map((item) => (
              <TaskCard key={item.task.id} {...item} />
            ))}
          </div>
        )}
        {tab === "tasks" && historyItems.length > 0 && (
          <SubmissionHistory items={historyItems} />
        )}
        {tab === "locations" && (
          <div className="host-explore-grid">
            {locations.map((item) => (
              <LocationCard key={item.location.id} {...item} />
            ))}
          </div>
        )}
        {tab === "routes" && (
          <div className="host-explore-grid">
            {routes.map((item) => (
              <RouteCard key={item.route.id} {...item} />
            ))}
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
              onClick={onClearFilters}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>
      {dialog}
    </>
  );
}
