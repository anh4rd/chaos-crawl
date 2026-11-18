import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";

import type { ReviewItemModel } from "./viewTypes";

export default function CommunityReviewItem({
  item,
}: {
  item: ReviewItemModel;
}) {
  return (
    <article className="host-community-review-card">
      <div>
        <span className="host-community-type">{item.itemType}</span>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        {item.details && (
          <small>
            {item.details.kind}
            {" ·"} {item.details.minutes}
            {" min ·"} {item.details.points}
            {" points"}
          </small>
        )}
        <small>
          {"Submitted"} {item.submittedDate}
        </small>
      </div>
      <div className="host-community-review-actions">
        <Button
          type="button"
          variant="comic-lime"
          fullWidth={false}
          disabled={item.busy}
          onClick={() => item.onApprove()}
        >
          <Icon name="check-circle2" className="icon--size-15" /> Approve
        </Button>
        <Button
          type="button"
          variant="comic-secondary"
          fullWidth={false}
          disabled={item.busy}
          onClick={() => item.onReject()}
        >
          <Icon name="x-circle" className="icon--size-15" /> Reject
        </Button>
      </div>
    </article>
  );
}
