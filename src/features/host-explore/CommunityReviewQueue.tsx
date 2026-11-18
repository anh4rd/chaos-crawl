import ContentPanel from "../../components/ui/ContentPanel";
import PanelHeading from "../../components/ui/PanelHeading";
import PanelGrid from "../../components/ui/PanelGrid";
import Overline from "../../components/ui/Overline";
import CountBadge from "../../components/ui/CountBadge";
import CommunityReviewItem from "./CommunityReviewItem";
import Icon from "../../components/ui/Icon";
import type { ReviewItemModel } from "./viewTypes";

export default function CommunityReviewQueue({
  items,
}: {
  items: ReviewItemModel[];
}) {
  return (
    <ContentPanel variant="moderation">
      <PanelHeading variant="moderation">
        <div>
          <Overline variant="moderation">
            <Icon name="shield-check" className="icon--size-14" /> PLATFORM
            MODERATION
          </Overline>
          <h2>
            Community review queue{" "}
            <CountBadge variant="moderation">{items.length}</CountBadge>
          </h2>
          <p>
            Approve safe, clear contributions to publish them to every host's
            Explore library.
          </p>
        </div>
      </PanelHeading>
      <PanelGrid variant="stack">
        {items.map((item) => (
          <CommunityReviewItem key={item.id} item={item} />
        ))}
      </PanelGrid>
    </ContentPanel>
  );
}
