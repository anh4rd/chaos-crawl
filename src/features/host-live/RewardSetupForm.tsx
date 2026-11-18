import type { RewardMethod, RewardTargetKind } from "../../types/hostSession";
import FormLabel from "../../components/ui/FormLabel";
import ControlRow from "../../components/ui/ControlRow";
import type { FormEvent } from "react";
import Button from "../../components/ui/Button";
import Note from "../../components/ui/Note";
import Icon from "../../components/ui/Icon";
import type { SessionChallenge } from "./types";

interface Props {
  busy: boolean;
  rewardChallengeId: string;
  setRewardChallengeId: (id: string) => void;
  challenges: Pick<
    SessionChallenge,
    "id" | "title" | "kind" | "round_number" | "points"
  >[];
  setRewardPoints: (points: number) => void;
  rewardMethod: RewardMethod;
  setRewardMethod: (method: RewardMethod) => void;
  enabledRewardMethods: RewardMethod[];
  rewardMethodLabel: (method: RewardMethod) => string;
  rewardTargetKind: RewardTargetKind;
  setRewardTargetKind: (target: RewardTargetKind) => void;
  setSelectedRewardWinnerIds: (ids: string[]) => void;
  session: { teams_enabled: boolean };
  teams: { id: string }[];
  rewardPoints: number;
  startRewardRound: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  setShowRewardSetup: (visible: boolean) => void;
}

export default function RewardSetupForm({
  busy,
  rewardChallengeId,
  setRewardChallengeId,
  challenges,
  setRewardPoints,
  rewardMethod,
  setRewardMethod,
  enabledRewardMethods,
  rewardMethodLabel,
  rewardTargetKind,
  setRewardTargetKind,
  setSelectedRewardWinnerIds,
  session,
  teams,
  rewardPoints,
  startRewardRound,
  setShowRewardSetup,
}: Props) {
  return (
    <form
      className="reward-setup"
      onSubmit={(event) => void startRewardRound(event)}
    >
      <FormLabel variant="reward">
        <span>Challenge</span>
        <select
          required
          value={rewardChallengeId}
          onChange={(event) => {
            const nextId = event.target.value;
            setRewardChallengeId(nextId);
            const chosen = challenges.find((item) => item.id === nextId);
            if (chosen) setRewardPoints(chosen.points);
          }}
          disabled={busy}
        >
          <option value="">Choose challenge…</option>
          {challenges.map((challenge) => (
            <option key={challenge.id} value={challenge.id}>
              {challenge.kind === "main"
                ? `Round ${challenge.round_number}`
                : challenge.kind === "side"
                  ? "Side challenge"
                  : "Secret mission"}{" "}
              · {challenge.title}
            </option>
          ))}
        </select>
      </FormLabel>
      <FormLabel variant="reward">
        <span>Reward method</span>
        <select
          value={rewardMethod}
          onChange={(event) =>
            setRewardMethod(event.target.value as RewardMethod)
          }
          disabled={busy}
        >
          {enabledRewardMethods.map((method) => (
            <option key={method} value={method}>
              {rewardMethodLabel(method)}
            </option>
          ))}
        </select>
      </FormLabel>
      <FormLabel variant="reward">
        <span>Reward players or teams?</span>
        <select
          value={rewardTargetKind}
          onChange={(event) => {
            setRewardTargetKind(event.target.value as RewardTargetKind);
            setSelectedRewardWinnerIds([]);
          }}
          disabled={busy}
        >
          <option value="player">Individual players</option>
          <option
            value="team"
            disabled={!session.teams_enabled || teams.length === 0}
          >
            Teams
          </option>
        </select>
      </FormLabel>
      <FormLabel variant="reward">
        <span>Points per winner</span>
        <input
          type="number"
          min={0}
          max={10000}
          value={rewardPoints}
          onChange={(event) => setRewardPoints(Number(event.target.value))}
          disabled={busy}
        />
      </FormLabel>
      <Note variant="session">
        The player screens will switch to the selected reward flow until you
        release them back to the game. If the vote is tied, every top-voted
        player/team wins.
      </Note>
      <ControlRow variant="reward">
        <Button
          type="button"
          variant="session-ghost"
          fullWidth={false}
          disabled={busy}
          onClick={() => setShowRewardSetup(false)}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="session-action"
          fullWidth={false}
          disabled={
            busy || !rewardChallengeId || enabledRewardMethods.length === 0
          }
        >
          {busy ? (
            <Icon
              name="loader-circle"
              className="icon--size-16 icon--spinning-session"
            />
          ) : (
            <Icon name="play" className="icon--size-16" />
          )}{" "}
          Start reward flow
        </Button>
      </ControlRow>
    </form>
  );
}
