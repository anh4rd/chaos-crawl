var e=`import type { ReactNode } from "react";
import Button from "../../components/ui/Button";
import Dialog from "../../components/ui/Dialog";
import DialogPanel from "../../components/ui/DialogPanel";
import IconButton from "../../components/ui/IconButton";
import Overline from "../../components/ui/Overline";
import Note from "../../components/ui/Note";
import ContentPanel from "../../components/ui/ContentPanel";
import ControlRow from "../../components/ui/ControlRow";
import type { PlatformGameDetail } from "../../types/superAdmin";

export default function GameInspector({
  selected,
  detailLoading,
  onClose,
  onRetry,
  feedback,
  playerContent,
  onManagePlayers,
}: {
  selected: PlatformGameDetail | null;
  detailLoading: boolean;
  onClose: () => void;
  onRetry: () => void;
  feedback?: ReactNode;
  playerContent?: ReactNode;
  onManagePlayers?: (sessionId: string) => void;
}) {
  return (
    <Dialog label="Game inspector" variant="inspector" onClose={onClose}>
      <DialogPanel variant="inspector">
        <IconButton
          type="button"
          label="Close game inspector"
          icon="x"
          iconClassName="icon--size-24"
          variant="panel-close"
          onClick={onClose}
        />
        {feedback}
        {playerContent ? (
          playerContent
        ) : detailLoading ? (
          <p>Loading game details…</p>
        ) : selected ? (
          <>
            <Overline variant="inverse">GAME INSPECTOR</Overline>
            <h2>{String(selected.game.name ?? "Game")}</h2>
            <Note variant="inverse">
              Host: {String(selected.game.host_email ?? "Unknown")}
            </Note>
            <h3>Sessions and players</h3>
            {selected.sessions.map((session) => (
              <ContentPanel as="article" variant="record" key={session.id}>
                <ControlRow variant="record-header">
                  <strong>{session.name}</strong>
                  <Note as="span" variant="record">
                    {session.status} · Code {session.join_code}
                  </Note>
                </ControlRow>
                {session.players.map((player) => (
                  <ControlRow variant="score" key={player.name}>
                    <span>
                      {player.name}
                      {player.team_name ? \` · \${player.team_name}\` : ""}
                    </span>
                    <b>{player.score} pts</b>
                  </ControlRow>
                ))}
                {onManagePlayers && (
                  <Button
                    type="button"
                    variant="comic-secondary"
                    fullWidth={false}
                    onClick={() => onManagePlayers(session.id)}
                  >
                    Manage players in {session.name}
                  </Button>
                )}
              </ContentPanel>
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
      </DialogPanel>
    </Dialog>
  );
}
`;export{e as default};