import FeatureBanner from "../../components/ui/FeatureBanner";
import StickerArt from "../../components/ui/StickerArt";
import ContentPanel from "../../components/ui/ContentPanel";
import PageHeading from "../../components/ui/PageHeading";
import ControlRow from "../../components/ui/ControlRow";
import PanelGrid from "../../components/ui/PanelGrid";
import EmptyState from "../../components/ui/EmptyState";
import Note from "../../components/ui/Note";
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
      <FeatureBanner
        eyebrow="YOUR NEXT GOOD BAD IDEA"
        title="Steal a little inspiration."
        artwork={
          <StickerArt icon="sparkles">
            IDEAS
            <br />
            INSIDE
          </StickerArt>
        }
      >
        Browse ready-to-use tasks, places to host and route templates. Create
        your own challenges and submit them to the community library.
      </FeatureBanner>
      {error && (
        <ContentPanel as="div" variant="workspace-error" role="alert">
          {error}
        </ContentPanel>
      )}
      {reviewItems.length > 0 && <CommunityReviewQueue items={reviewItems} />}
      <CatalogueFilters {...filters} />
      <div>
        <PageHeading
          variant="results"
          title={heading}
          subtitle={description}
          action={
            <ControlRow variant="heading-actions">
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
                  <Icon name="plus" className="icon--size-16" /> Create
                  challenge
                </Button>
              )}
            </ControlRow>
          }
        />
        {loadingFavourites && (
          <Note as="div" variant="collection-loading">
            Checking your saved items…
          </Note>
        )}
        {tab === "tasks" && (
          <PanelGrid variant="ideas">
            {tasks.map((item) => (
              <TaskCard key={item.task.id} {...item} />
            ))}
          </PanelGrid>
        )}
        {tab === "tasks" && historyItems.length > 0 && (
          <SubmissionHistory items={historyItems} />
        )}
        {tab === "locations" && (
          <PanelGrid variant="ideas">
            {locations.map((item) => (
              <LocationCard key={item.location.id} {...item} />
            ))}
          </PanelGrid>
        )}
        {tab === "routes" && (
          <PanelGrid variant="ideas">
            {routes.map((item) => (
              <RouteCard key={item.route.id} {...item} />
            ))}
          </PanelGrid>
        )}
        {!itemCount && (
          <EmptyState
            variant="workspace"
            icon="search"
            title="No matches"
            action={
              <Button
                type="button"
                variant="comic-secondary"
                fullWidth={false}
                onClick={onClearFilters}
              >
                Clear filters
              </Button>
            }
          >
            Try a different search or clear your filters.
          </EmptyState>
        )}
      </div>
      {dialog}
    </>
  );
}
