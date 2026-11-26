var e=`import ContentPanel from "../../components/ui/ContentPanel";
import PanelGrid from "../../components/ui/PanelGrid";
import PanelHeading from "../../components/ui/PanelHeading";
import type {
  HostChallengeOverview,
  HostChallengeSummary,
} from "../../types/hostHub";

export default function HostChallengesView({
  data,
}: {
  data: HostChallengeOverview;
}) {
  function entries(items: HostChallengeSummary[]) {
    if (!items.length) return <p>No challenges found.</p>;
    return (
      <PanelGrid variant="stack">
        {items.map((item) => {
          const details =
            item.details &&
            typeof item.details === "object" &&
            !Array.isArray(item.details)
              ? item.details
              : {};
          const fields = Object.entries(details).filter(
            ([key, value]) =>
              [
                "kind",
                "points",
                "minutes",
                "prepMinutes",
                "performanceMinutes",
                "setup",
              ].includes(key) &&
              (typeof value === "string" || typeof value === "number"),
          );
          const tags =
            "tags" in details && Array.isArray(details.tags)
              ? details.tags.filter(
                  (tag): tag is string => typeof tag === "string",
                )
              : [];
          return (
            <ContentPanel as="article" variant="record" key={item.id}>
              <h4>{item.title}</h4>
              <p>
                {item.source}
                {item.status ? \` · \${item.status}\` : ""}
              </p>
              {item.description && <p>{item.description}</p>}
              {fields.length > 0 && (
                <p>
                  {fields
                    .map(([key, value]) => \`\${key}: \${String(value)}\`)
                    .join(" · ")}
                </p>
              )}
              {tags.length > 0 && <p>Tags: {tags.join(", ")}</p>}
            </ContentPanel>
          );
        })}
      </PanelGrid>
    );
  }
  return (
    <section className="host-dashboard__section" aria-label="Host challenges">
      <PanelHeading variant="workspace">
        <div>
          <h2>Host challenges</h2>
          <p>Read-only challenge activity for this host.</p>
        </div>
      </PanelHeading>
      <h3>Liked challenges</h3>
      {entries(data.liked)}
      <h3>Created challenges</h3>
      <p>
        Community submissions and custom challenges in this host's game plans.
      </p>
      {entries(data.created)}
    </section>
  );
}
`;export{e as default};