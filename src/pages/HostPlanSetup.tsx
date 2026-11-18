import { useParams, useSearchParams } from "react-router-dom";
import PlanEditor from "../features/host-planning/PlanEditor";
export default function HostPlanSetup() {
  const { id } = useParams();
  const [params] = useSearchParams();
  return (
    <PlanEditor
      key={id ?? "new"}
      id={id}
      communityTaskId={params.get("communityTask")}
      exploreTaskJson={params.get("exploreTask")}
      requestedChallengeKind={
        params.get("challengeKind") === "side" ? "side" : "main"
      }
    />
  );
}
