import { useId } from "react";
import Button from "../../components/ui/Button";
import Dialog from "../../components/ui/Dialog";
import DialogActions from "../../components/ui/DialogActions";
import DialogNotice from "../../components/ui/DialogNotice";
import DialogPanel from "../../components/ui/DialogPanel";
import type { ExploreGame } from "../../lib/hostExploreQueries";

export default function GameSelectionDialog({
  games,
  loading,
  saving,
  error,
  onChoose,
  onCreate,
  onRetry,
  onClose,
}: {
  games: ExploreGame[];
  loading: boolean;
  saving: boolean;
  error: string;
  onChoose: (game: ExploreGame) => void;
  onCreate: () => void;
  onRetry: () => void;
  onClose: () => void;
}) {
  const titleId = useId();
  return (
    <Dialog
      variant="host"
      label="Add challenge to a game"
      labelledBy={titleId}
      onClose={onClose}
      dismissDisabled={saving}
    >
      <DialogPanel>
        <h2 id={titleId}>Add challenge to a game</h2>
        {saving && <p role="status">Adding challenge…</p>}
        {loading ? (
          <p>Loading your games…</p>
        ) : games.length ? (
          <>
            <p>
              Choose a draft or planned game. Live and completed games cannot be
              changed here.
            </p>
            <ul>
              {games.map((game) => (
                <li key={game.id}>
                  <Button
                    type="button"
                    variant="dialog"
                    fullWidth={false}
                    disabled={saving}
                    onClick={() => onChoose(game)}
                  >
                    {game.name} ({game.status})
                  </Button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          !error && (
            <p>
              No draft or planned games are available. Create a game to add this
              challenge.
            </p>
          )
        )}
        {error && (
          <div role="alert">
            <DialogNotice kind="error">{error}</DialogNotice>
          </div>
        )}
        {error && !saving && (
          <Button
            type="button"
            variant="dialog"
            fullWidth={false}
            onClick={onRetry}
          >
            Retry
          </Button>
        )}
        <DialogActions>
          <Button
            type="button"
            variant="dialog"
            fullWidth={false}
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </Button>
          {!loading && !games.length && !error && (
            <Button
              type="button"
              variant="dialog-primary"
              fullWidth={false}
              onClick={onCreate}
            >
              Create game
            </Button>
          )}
        </DialogActions>
      </DialogPanel>
    </Dialog>
  );
}
