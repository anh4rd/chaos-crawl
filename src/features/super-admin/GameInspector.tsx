import type { ReactNode } from "react";
import Button from "../../components/ui/Button";
import Dialog from "../../components/ui/Dialog";
import Icon from "../../components/ui/Icon";
import type { PlatformGameDetail } from "../../types/superAdmin";

export default function GameInspector({
  selected,
  detailLoading,
  onClose,
  onRetry,
  feedback,
}: {
  selected: PlatformGameDetail | null;
  detailLoading: boolean;
  onClose: () => void;
  onRetry: () => void;
  feedback?: ReactNode;
}) {
  return (
    <Dialog
      label="Game inspector"
      className="sa-modal-backdrop"
      onClose={onClose}
    >
      <section className="sa-modal">
        <button
          type="button"
          aria-label="Close game inspector"
          className="sa-close"
          onClick={onClose}
        >
          <Icon name="x" className="icon--size-24" />
        </button>
        {feedback}
        {detailLoading ? (
          <p>Loading game details…</p>
        ) : selected ? (
          <>
            <span className="sa-kicker">GAME INSPECTOR</span>
            <h2>{String(selected.game.name ?? "Game")}</h2>
            <p className="sa-muted">
              Host: {String(selected.game.host_email ?? "Unknown")}
            </p>
            <h3>Sessions and players</h3>
            {selected.sessions.map((s) => (
              <article className="sa-session" key={s.id}>
                <div>
                  <strong>{s.name}</strong>
                  <span>
                    {s.status} · Code {s.join_code}
                  </span>
                </div>
                {s.players.map((p) => (
                  <div className="sa-player" key={p.name}>
                    <span>
                      {p.name}
                      {p.team_name ? ` · ${p.team_name}` : ""}
                    </span>
                    <b>{p.score} pts</b>
                  </div>
                ))}
              </article>
            ))}
          </>
        ) : (
          <Button
            type="button"
            variant="comic-secondary"
            fullWidth={false}
            onClick={onRetry}
          >
            Retry inspection
          </Button>
        )}
      </section>
    </Dialog>
  );
}
