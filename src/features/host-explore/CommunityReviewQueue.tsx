import CommunityReviewItem from "./CommunityReviewItem";
import Icon from "../../components/ui/Icon";
import type { ReviewItemModel } from "./viewTypes";

export default function CommunityReviewQueue({
  items,
}: {
  items: ReviewItemModel[];
}) {
  return (
    <section className="host-community-review">
      <div className="host-community-section-heading">
        <div>
          <span className="host-community-kicker">
            <Icon name="shield-check" className="icon--size-14" /> PLATFORM
            MODERATION
          </span>
          <h2>
            Community review queue <span>{items.length}</span>
          </h2>
          <p>
            Approve safe, clear contributions to publish them to every host's
            Explore library.
          </p>
        </div>
      </div>
      <div className="host-community-review-list">
        {items.map((item) => (
          <CommunityReviewItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
