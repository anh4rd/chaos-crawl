import DialogNotice from "../../components/ui/DialogNotice";
import FormLabel from "../../components/ui/FormLabel";
import DialogPanel from "../../components/ui/DialogPanel";
import DialogActions from "../../components/ui/DialogActions";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Dialog from "../../components/ui/Dialog";
import type { Dispatch, SetStateAction } from "react";
import { type FormEvent } from "react";
import type { GameSession } from "./types";

interface BreakTimerEditorProps {
  busy: boolean;
  setEditingBreakTimer: Dispatch<SetStateAction<boolean>>;
  saveBreakTimer: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  breakResumeRound: number | null;
  session: GameSession;
  editBreakMinutes: number;
  setEditBreakMinutes: Dispatch<SetStateAction<number>>;
  error: string;
  onDismissError: () => void;
}

export default function BreakTimerEditor({
  busy,
  setEditingBreakTimer,
  saveBreakTimer,
  breakResumeRound,
  session,
  editBreakMinutes,
  setEditBreakMinutes,
  error,
  onDismissError,
}: BreakTimerEditorProps) {
  return (
    <Dialog
      variant="host"
      label="Edit the time until the next round"
      labelledBy="cc-host-break-timer-title"
      dismissDisabled={busy}
      onClose={() => setEditingBreakTimer(false)}
    >
      <DialogPanel as="form" onSubmit={(event) => void saveBreakTimer(event)}>
        <Badge variant="dialog">BREAK TIMER</Badge>
        <h2 id="cc-host-break-timer-title">
          Edit the time until the next round
        </h2>
        <p>
          Round {breakResumeRound ?? session.current_round_number + 1} will
          start when the break timer ends.
        </p>
        <FormLabel spaced>
          Break minutes
          <input
            type="number"
            min={1}
            max={240}
            required
            value={editBreakMinutes}
            disabled={busy}
            onChange={(event) =>
              setEditBreakMinutes(Number(event.target.value))
            }
          />
        </FormLabel>
        {error && (
          <DialogNotice kind="error" onDismiss={onDismissError}>
            {error}
          </DialogNotice>
        )}
        <DialogActions>
          <Button
            fullWidth={false}
            variant="dialog"
            type="button"
            disabled={busy}
            onClick={() => setEditingBreakTimer(false)}
          >
            Cancel
          </Button>
          <Button
            fullWidth={false}
            variant="dialog-primary"
            type="submit"
            disabled={busy || editBreakMinutes < 1}
          >
            {busy ? "Saving…" : "Save timer"}
          </Button>
        </DialogActions>
      </DialogPanel>
    </Dialog>
  );
}
