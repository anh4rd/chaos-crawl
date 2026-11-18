import Button from "../../components/ui/Button";
import type { HostDirectoryEntry } from "../../types/hostHub";
export default function HostDirectory({
  hosts,
  onPreview,
}: {
  hosts: HostDirectoryEntry[];
  onPreview: (hostId: string) => void;
}) {
  return (
    <section className="host-list-section host-platform-admin-section">
      <div className="host-section-heading">
        <div>
          <span className="host-admin-kicker">PLATFORM ADMIN</span>
          <h2>Host accounts</h2>
          <p>
            Open a read-only Host Hub dashboard view to see the games another
            host sees.
          </p>
        </div>
        <span className="host-tab-count">{hosts.length} hosts</span>
      </div>
      {hosts.length ? (
        <div className="host-admin-host-list">
          {hosts.map((host) => (
            <article className="host-admin-host-row" key={host.host_id}>
              <div className="host-admin-avatar">
                {(host.display_name || host.email || "H")
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
              <div className="host-admin-host-copy">
                <strong>
                  {host.display_name || host.email || "Host account"}
                </strong>
                <span>{host.email || "No email"}</span>
                <small>
                  {host.game_count} {host.game_count === 1 ? "game" : "games"} ·
                  joined {new Date(host.created_at).toLocaleDateString()}
                </small>
              </div>
              <Button
                type="button"
                variant="comic-secondary"
                fullWidth={false}
                onClick={() => onPreview(host.host_id)}
              >
                View Host Hub
              </Button>
            </article>
          ))}
        </div>
      ) : (
        <div className="host-empty-state">No host accounts found.</div>
      )}
    </section>
  );
}
