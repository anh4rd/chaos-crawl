var e=`import Avatar from "../../components/ui/Avatar";
import EmptyState from "../../components/ui/EmptyState";
import ContentCopy from "../../components/ui/ContentCopy";
import ContentPanel from "../../components/ui/ContentPanel";
import PanelGrid from "../../components/ui/PanelGrid";
import CountBadge from "../../components/ui/CountBadge";
import Overline from "../../components/ui/Overline";
import PanelHeading from "../../components/ui/PanelHeading";
import Button from "../../components/ui/Button";
import type { HostDirectoryEntry } from "../../types/hostHub";
export default function HostDirectory({
  className = "",
  hosts,
  onPreview,
}: {
  className?: string;
  hosts: HostDirectoryEntry[];
  onPreview: (hostId: string) => void;
}) {
  return (
    <section className={\`host-directory \${className}\`.trim()}>
      <PanelHeading variant="workspace">
        <div>
          <Overline variant="directory">PLATFORM ADMIN</Overline>
          <h2>Host accounts</h2>
          <p>
            Open a read-only Host Hub preview to see a host's games and
            challenges.
          </p>
        </div>
        <CountBadge variant="workspace">{hosts.length} hosts</CountBadge>
      </PanelHeading>
      {hosts.length ? (
        <PanelGrid variant="directory">
          {hosts.map((host) => (
            <ContentPanel variant="account" as="article" key={host.host_id}>
              <Avatar
                variant="directory"
                as="div"
                name={host.display_name || host.email || "H"}
              />
              <ContentCopy variant="directory">
                <strong>
                  {host.display_name || host.email || "Host account"}
                </strong>
                <span>{host.email || "No email"}</span>
                <small>
                  {host.game_count} {host.game_count === 1 ? "game" : "games"} ·
                  joined {new Date(host.created_at).toLocaleDateString()}
                </small>
              </ContentCopy>
              <Button
                type="button"
                variant="comic-secondary"
                fullWidth={false}
                onClick={() => onPreview(host.host_id)}
              >
                View Host Hub
              </Button>
            </ContentPanel>
          ))}
        </PanelGrid>
      ) : (
        <EmptyState variant="workspace-panel">
          No host accounts found.
        </EmptyState>
      )}
    </section>
  );
}
`;export{e as default};