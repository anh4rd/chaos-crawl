import Explainer from "../../components/ui/Explainer";
import ContentPanel from "../../components/ui/ContentPanel";
import Icon from "../../components/ui/Icon";
export default function PlanReviewInfo() {
  return (
    <ContentPanel variant="section">
      <Explainer>
        <Icon name="info" className="icon--size-18" />
        <p>
          <strong>Submission review happens during the live game.</strong>{" "}
          {
            "Once you launch a session, use the Host Controls and Review tools there to inspect player submissions, approve evidence and manage scores."
          }
        </p>
      </Explainer>
      <p>Before launch, use Review & Launch for the final plan checks.</p>
    </ContentPanel>
  );
}
