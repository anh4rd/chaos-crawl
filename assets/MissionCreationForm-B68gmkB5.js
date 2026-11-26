var e=`import Disclosure from "../../components/ui/Disclosure";
import FormLabel from "../../components/ui/FormLabel";
import type { FormEvent } from "react";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";

interface Props {
  createSecretChallenge: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  newSecretTitle: string;
  setNewSecretTitle: (value: string) => void;
  newSecretDescription: string;
  setNewSecretDescription: (value: string) => void;
  newSecretPoints: number;
  setNewSecretPoints: (value: number) => void;
  newSecretEvidenceRequired: boolean;
  setNewSecretEvidenceRequired: (value: boolean) => void;
  busy: boolean;
}
export default function MissionCreationForm({
  createSecretChallenge,
  newSecretTitle,
  setNewSecretTitle,
  newSecretDescription,
  setNewSecretDescription,
  newSecretPoints,
  setNewSecretPoints,
  newSecretEvidenceRequired,
  setNewSecretEvidenceRequired,
  busy,
}: Props) {
  return (
    <Disclosure
      variant="session"
      summary="Add a custom secret mission to this game"
    >
      <form
        className="mission-creation"
        onSubmit={(event) => void createSecretChallenge(event)}
      >
        <FormLabel variant="session">
          <span>Mission title</span>
          <input
            value={newSecretTitle}
            onChange={(event) => setNewSecretTitle(event.target.value)}
            maxLength={100}
            required
            placeholder="e.g. Get someone to start a conga line"
          />
        </FormLabel>
        <FormLabel variant="session">
          <span>Instructions (private to the assigned player)</span>
          <textarea
            value={newSecretDescription}
            onChange={(event) => setNewSecretDescription(event.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="What should this one player do?"
          />
        </FormLabel>
        <FormLabel variant="session">
          <span>Points</span>
          <input
            type="number"
            min={0}
            max={10000}
            value={newSecretPoints}
            onChange={(event) => setNewSecretPoints(Number(event.target.value))}
          />
        </FormLabel>
        <FormLabel variant="session-checkbox">
          <span>
            <input
              type="checkbox"
              checked={newSecretEvidenceRequired}
              onChange={(event) =>
                setNewSecretEvidenceRequired(event.target.checked)
              }
            />{" "}
            Require photo/video evidence
          </span>
        </FormLabel>
        <Button
          type="submit"
          variant="session-secondary"
          fullWidth={false}
          disabled={busy || !newSecretTitle.trim()}
        >
          <Icon name="check" className="icon--size-16" /> Add mission
        </Button>
      </form>
    </Disclosure>
  );
}
`;export{e as default};