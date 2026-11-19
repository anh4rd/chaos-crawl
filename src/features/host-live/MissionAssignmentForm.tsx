import FormLabel from "../../components/ui/FormLabel";
import type { FormEvent } from "react";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
interface Props {
  assignSecretMission: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  selectedSecretPlayerId: string;
  setSelectedSecretPlayerId: (value: string) => void;
  busy: boolean;
  players: { id: string; name: string }[];
  selectedSecretChallengeId: string;
  setSelectedSecretChallengeId: (value: string) => void;
  secretChallenges: { id: string; title: string; points: number }[];
  secretScheduleAt: string;
  setSecretScheduleAt: (value: string) => void;
}
export default function MissionAssignmentForm({
  assignSecretMission,
  selectedSecretPlayerId,
  setSelectedSecretPlayerId,
  busy,
  players,
  selectedSecretChallengeId,
  setSelectedSecretChallengeId,
  secretChallenges,
  secretScheduleAt,
  setSecretScheduleAt,
}: Props) {
  return (
    <form
      className="mission-assignment"
      onSubmit={(event) => void assignSecretMission(event)}
    >
      <FormLabel variant="session">
        <span>Send to one player</span>
        <select
          value={selectedSecretPlayerId}
          onChange={(event) => setSelectedSecretPlayerId(event.target.value)}
          required
          disabled={busy || players.length === 0}
        >
          <option value="">Choose player…</option>
          {players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>
      </FormLabel>
      <FormLabel variant="session">
        <span>Secret mission</span>
        <select
          value={selectedSecretChallengeId}
          onChange={(event) => setSelectedSecretChallengeId(event.target.value)}
          required
          disabled={busy || secretChallenges.length === 0}
        >
          <option value="">Choose mission…</option>
          {secretChallenges.map((challenge) => (
            <option key={challenge.id} value={challenge.id}>
              {challenge.title} · {challenge.points} pts
            </option>
          ))}
        </select>
      </FormLabel>
      <FormLabel variant="session" className="mission-assignment__time">
        <span>
          <Icon name="calendar-clock" className="icon--size-14" /> Deliver at
          (optional)
        </span>
        <input
          type="datetime-local"
          value={secretScheduleAt}
          onChange={(event) => setSecretScheduleAt(event.target.value)}
          disabled={busy}
        />
        <small>
          Leave blank to send immediately, or queue until the game goes live.
        </small>
      </FormLabel>
      <Button
        type="submit"
        variant="session-send"
        fullWidth={false}
        disabled={
          busy ||
          !selectedSecretPlayerId ||
          !selectedSecretChallengeId ||
          players.length === 0 ||
          secretChallenges.length === 0
        }
      >
        {busy ? (
          <Icon
            name="loader-circle"
            className="icon--size-16 icon--spinning-session"
          />
        ) : (
          <Icon name="send" className="icon--size-16" />
        )}{" "}
        Assign secret mission
      </Button>
    </form>
  );
}
