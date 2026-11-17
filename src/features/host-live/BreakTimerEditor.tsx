import type { Dispatch, SetStateAction } from "react";
import { type FormEvent } from "react";
import Icon from "../../components/ui/Icon";
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
  setError: Dispatch<SetStateAction<string>>;
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
  setError,
}: BreakTimerEditorProps) {
  return (
    <div
      className="cc-host-override-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy)
          setEditingBreakTimer(false);
      }}
    >
      <form
        className="cc-host-override-dialog cc-host-break-edit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cc-host-break-timer-title"
        onSubmit={(event) => void saveBreakTimer(event)}
      >
        <span className="cc-host-override-kicker">BREAK TIMER</span>
        <h2 id="cc-host-break-timer-title">
          Edit the time until the next round
        </h2>
        <p>
          Round {breakResumeRound ?? session.current_round_number + 1} will
          start when the break timer ends.
        </p>
        <label>
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
        </label>
        {error && (
          <div className="cc-host-override-blocked" role="alert">
            <span>{error}</span>
            <button
              type="button"
              className="cc-host-alert-dismiss"
              aria-label="Dismiss error"
              onClick={() => setError("")}
            >
              <Icon name="x" className="icon--size-16" />
            </button>
          </div>
        )}
        <div className="cc-host-override-actions">
          <button
            type="button"
            disabled={busy}
            onClick={() => setEditingBreakTimer(false)}
          >
            Cancel
          </button>
          <button type="submit" disabled={busy || editBreakMinutes < 1}>
            {busy ? "Saving…" : "Save timer"}
          </button>
        </div>
      </form>
    </div>
  );
}
