var e=`import ContentPanel from "../../components/ui/ContentPanel";
import ControlRow from "../../components/ui/ControlRow";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";

import type { ReviewItemModel } from "./viewTypes";

export default function CommunityReviewItem({
  item,
}: {
  item: ReviewItemModel;
}) {
  return (
    <ContentPanel as="article" variant="moderation-item">
      <div>
        <Badge variant="moderation-type">{item.itemType}</Badge>
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
      <ControlRow variant="moderation">
        <Button
          type="button"
          variant="moderation-approve"
          fullWidth={false}
          disabled={item.busy}
          onClick={() => item.onApprove()}
        >
          <Icon name="check-circle2" className="icon--size-15" /> Approve
        </Button>
        <Button
          type="button"
          variant="moderation-secondary"
          fullWidth={false}
          disabled={item.busy}
          onClick={() => item.onReject()}
        >
          <Icon name="x-circle" className="icon--size-15" /> Reject
        </Button>
      </ControlRow>
    </ContentPanel>
  );
}
`;export{e as default};