import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import FeedbackNotice from "../../components/ui/FeedbackNotice";
import { failedResult } from "../../lib/apiResult";
import { readHostChallengeOverview } from "../../lib/hostHubQueries";
import type { HostChallengeOverview } from "../../types/hostHub";
import HostChallengesView from "./HostChallengesView";

export default function HostChallenges({ hostId }: { hostId: string }) {
  const [data, setData] = useState<HostChallengeOverview | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setData(null);
    setError("");
    void readHostChallengeOverview(hostId)
      .catch(failedResult)
      .then((result) => {
        if (!active) return;
        if (result.error || !result.data) {
          setError(
            result.error?.message ?? "Couldn't load this host's challenges.",
          );
        } else setData(result.data);
      });
    return () => {
      active = false;
    };
  }, [hostId, attempt]);
  if (error)
    return (
      <section className="host-dashboard__section" aria-label="Host challenges">
        <FeedbackNotice tone="error">{error}</FeedbackNotice>
        <Button
          type="button"
          variant="comic-secondary"
          fullWidth={false}
          onClick={() => setAttempt((value) => value + 1)}
        >
          Retry challenges
        </Button>
      </section>
    );
  if (!data) return <p>Loading host challenges…</p>;
  return <HostChallengesView data={data} />;
}
