import type { Dispatch, SetStateAction } from "react";
import { type FormEvent } from "react";
import type { SessionChallenge } from "./types";

interface ChallengeEditorProps {
  busy: boolean;
  setEditingBreakChallenge: Dispatch<SetStateAction<SessionChallenge | null>>;
  saveBreakChallengeEdit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  editingBreakChallenge: SessionChallenge;
  editChallengeTitle: string;
  setEditChallengeTitle: Dispatch<SetStateAction<string>>;
  editChallengeDescription: string;
  setEditChallengeDescription: Dispatch<SetStateAction<string>>;
  editChallengeEquipment: string;
  setEditChallengeEquipment: Dispatch<SetStateAction<string>>;
  editChallengeDuration: number;
  setEditChallengeDuration: Dispatch<SetStateAction<number>>;
  editChallengePoints: number;
  setEditChallengePoints: Dispatch<SetStateAction<number>>;
  editChallengeEvidence: boolean;
  setEditChallengeEvidence: Dispatch<SetStateAction<boolean>>;
}

export default function ChallengeEditor({
  busy,
  setEditingBreakChallenge,
  saveBreakChallengeEdit,
  editingBreakChallenge,
  editChallengeTitle,
  setEditChallengeTitle,
  editChallengeDescription,
  setEditChallengeDescription,
  editChallengeEquipment,
  setEditChallengeEquipment,
  editChallengeDuration,
  setEditChallengeDuration,
  editChallengePoints,
  setEditChallengePoints,
  editChallengeEvidence,
  setEditChallengeEvidence,
}: ChallengeEditorProps) {
  return (
    <div
      className="cc-host-override-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy)
          setEditingBreakChallenge(null);
      }}
    >
      <form
        className="cc-host-override-dialog cc-host-break-edit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cc-host-break-edit-title"
        onSubmit={(event) => void saveBreakChallengeEdit(event)}
      >
        <span className="cc-host-override-kicker">
          EDIT ROUND {editingBreakChallenge.round_number}
        </span>
        <h2 id="cc-host-break-edit-title">Update the upcoming challenge</h2>
        <label>
          Challenge title
          <input
            required
            maxLength={100}
            value={editChallengeTitle}
            onChange={(event) => setEditChallengeTitle(event.target.value)}
          />
        </label>
        <label>
          Instructions
          <textarea
            rows={4}
            value={editChallengeDescription}
            onChange={(event) =>
              setEditChallengeDescription(event.target.value)
            }
          />
        </label>
        <label>
          Equipment needed <small>Separate items with commas.</small>
          <textarea
            rows={2}
            value={editChallengeEquipment}
            onChange={(event) => setEditChallengeEquipment(event.target.value)}
          />
        </label>
        <div className="cc-host-break-edit-numbers">
          <label>
            Minutes
            <input
              type="number"
              min={1}
              max={240}
              value={editChallengeDuration}
              onChange={(event) =>
                setEditChallengeDuration(Number(event.target.value))
              }
            />
          </label>
          <label>
            Points
            <input
              type="number"
              min={0}
              max={1000}
              value={editChallengePoints}
              onChange={(event) =>
                setEditChallengePoints(Number(event.target.value))
              }
            />
          </label>
        </div>
        <label className="cc-host-break-edit-check">
          <input
            type="checkbox"
            checked={editChallengeEvidence}
            onChange={(event) => setEditChallengeEvidence(event.target.checked)}
          />{" "}
          Players must submit photo or video evidence
        </label>
        <div className="cc-host-override-actions">
          <button
            type="button"
            disabled={busy}
            onClick={() => setEditingBreakChallenge(null)}
          >
            Cancel
          </button>
          <button type="submit" disabled={busy || !editChallengeTitle.trim()}>
            {busy ? "Saving…" : "Save challenge"}
          </button>
        </div>
      </form>
    </div>
  );
}
