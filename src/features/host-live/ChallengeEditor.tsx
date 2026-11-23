import FormGrid from "../../components/ui/FormGrid";
import FormLabel from "../../components/ui/FormLabel";
import DialogPanel from "../../components/ui/DialogPanel";
import DialogActions from "../../components/ui/DialogActions";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import SessionFeedback from "../../components/session/SessionFeedback";
import Dialog from "../../components/ui/Dialog";
import type { Dispatch, SetStateAction } from "react";
import { type FormEvent } from "react";
import type { SessionChallenge } from "./types";

interface ChallengeEditorProps {
  busy: boolean;
  error: string;
  onDismissError: () => void;
  setEditingBreakChallenge: Dispatch<SetStateAction<SessionChallenge | null>>;
  saveBreakChallengeEdit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  editingBreakChallenge: SessionChallenge;
  editChallengeTitle: string;
  setEditChallengeTitle: Dispatch<SetStateAction<string>>;
  editChallengeDescription: string;
  setEditChallengeDescription: Dispatch<SetStateAction<string>>;
  editChallengeEquipment: string;
  canEditEquipment: boolean;
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
  error,
  onDismissError,
  setEditingBreakChallenge,
  saveBreakChallengeEdit,
  editingBreakChallenge,
  editChallengeTitle,
  setEditChallengeTitle,
  editChallengeDescription,
  setEditChallengeDescription,
  editChallengeEquipment,
  canEditEquipment,
  setEditChallengeEquipment,
  editChallengeDuration,
  setEditChallengeDuration,
  editChallengePoints,
  setEditChallengePoints,
  editChallengeEvidence,
  setEditChallengeEvidence,
}: ChallengeEditorProps) {
  return (
    <Dialog
      variant="host"
      label="Update challenge"
      labelledBy="cc-host-break-edit-title"
      dismissDisabled={busy}
      onClose={() => setEditingBreakChallenge(null)}
    >
      <DialogPanel
        as="form"
        onSubmit={(event) => void saveBreakChallengeEdit(event)}
      >
        <Badge variant="dialog">
          {editingBreakChallenge.round_number
            ? `EDIT ROUND ${editingBreakChallenge.round_number}`
            : "EDIT CHALLENGE"}
        </Badge>
        <h2 id="cc-host-break-edit-title">Update challenge</h2>
        <FormLabel spaced>
          Challenge title
          <input
            required
            maxLength={100}
            value={editChallengeTitle}
            onChange={(event) => setEditChallengeTitle(event.target.value)}
          />
        </FormLabel>
        <FormLabel spaced>
          Instructions
          <textarea
            rows={4}
            value={editChallengeDescription}
            onChange={(event) =>
              setEditChallengeDescription(event.target.value)
            }
          />
        </FormLabel>
        <FormLabel spaced>
          Equipment needed{" "}
          <small>
            {canEditEquipment
              ? "Separate items with commas."
              : "Equipment can't be saved because this challenge isn't linked to a saved plan."}
          </small>
          <textarea
            rows={2}
            disabled={!canEditEquipment}
            value={editChallengeEquipment}
            onChange={(event) => setEditChallengeEquipment(event.target.value)}
          />
        </FormLabel>
        <FormGrid variant="dialog">
          <FormLabel>
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
          </FormLabel>
          <FormLabel>
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
          </FormLabel>
        </FormGrid>
        <FormLabel spaced variant="checkbox">
          <input
            type="checkbox"
            checked={editChallengeEvidence}
            onChange={(event) => setEditChallengeEvidence(event.target.checked)}
          />{" "}
          Players must submit photo or video evidence
        </FormLabel>
        {error && (
          <SessionFeedback message={error} onDismiss={onDismissError} />
        )}
        <DialogActions>
          <Button
            fullWidth={false}
            variant="dialog"
            type="button"
            disabled={busy}
            onClick={() => setEditingBreakChallenge(null)}
          >
            Cancel
          </Button>
          <Button
            fullWidth={false}
            variant="dialog-primary"
            type="submit"
            disabled={busy || !editChallengeTitle.trim()}
          >
            {busy ? "Saving…" : "Save challenge"}
          </Button>
        </DialogActions>
      </DialogPanel>
    </Dialog>
  );
}
