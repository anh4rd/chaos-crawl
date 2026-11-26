var e=`import type { RewardMethod, RewardTargetKind } from "../../types/hostSession";
import FormLabel from "../../components/ui/FormLabel";
import ControlRow from "../../components/ui/ControlRow";
import { useId, useRef, useState, type FormEvent } from "react";
import Button from "../../components/ui/Button";
import Note from "../../components/ui/Note";
import Icon from "../../components/ui/Icon";
import type { SessionChallenge } from "./types";

interface Props {
  busy: boolean;
  currentRoundOnly: boolean;
  currentChallenge:
    | Pick<
        SessionChallenge,
        "id" | "title" | "kind" | "round_number" | "points"
      >
    | undefined;
  decideRewardInGame: boolean | null;
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
  currentRoundOnly,
  currentChallenge,
  decideRewardInGame,
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
  const [editingSettings, setEditingSettings] = useState(false);
  const settingsId = useId();
  const pointsInput = useRef<HTMLInputElement>(null);
  const rewardSettings = (
    <>
      <FormLabel variant="reward">
        <span>
          {currentRoundOnly ? "Rewarding" : "Reward players or teams?"}
        </span>
        <select
          value={rewardTargetKind}
          onChange={(event) => {
            setRewardTargetKind(
              event.target.value === "team" ? "team" : "player",
            );
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
          ref={pointsInput}
          type="number"
          min={0}
          max={10000}
          value={rewardPoints}
          onChange={(event) => setRewardPoints(Number(event.target.value))}
          disabled={busy}
        />
      </FormLabel>
    </>
  );
  const roundChanged =
    currentRoundOnly &&
    Boolean(rewardChallengeId) &&
    currentChallenge?.id !== rewardChallengeId;
  return (
    <form
      className={\`reward-setup\${currentRoundOnly ? " reward-setup--round-review" : ""}\`}
      onSubmit={(event) => void startRewardRound(event)}
    >
      {currentRoundOnly ? (
        <div className="reward-setup__round">
          <span>Reviewing</span>
          <strong>
            {currentChallenge
              ? \`Round \${currentChallenge.round_number ?? "—"} · \${currentChallenge.title}\`
              : "Current round unavailable"}
          </strong>
        </div>
      ) : (
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
                  ? \`Round \${challenge.round_number}\`
                  : challenge.kind === "side"
                    ? "Side challenge"
                    : "Secret mission"}{" "}
                · {challenge.title}
              </option>
            ))}
          </select>
        </FormLabel>
      )}
      {currentRoundOnly && decideRewardInGame ? (
        <fieldset className="reward-setup__methods">
          <legend>Choose a reward method</legend>
          <div className="reward-setup__method-grid">
            {(
              [
                { method: "host_awards", label: "Host choose", emoji: "1F451" },
                {
                  method: "audience_cheers",
                  label: "Audience cheers",
                  emoji: "1F44F",
                },
                { method: "voting", label: "Vote", emoji: "1F5F3" },
              ] as const
            ).map(({ method, label, emoji }) => (
              <button
                key={method}
                type="button"
                className="reward-setup__method"
                aria-pressed={rewardMethod === method}
                onClick={() => setRewardMethod(method)}
                disabled={busy || !enabledRewardMethods.includes(method)}
              >
                <img
                  src={\`\${import.meta.env.BASE_URL}openmoji/\${emoji}.svg\`}
                  alt=""
                />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </fieldset>
      ) : (
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
      )}
      {currentRoundOnly ? (
        <div className="reward-setup__summary" aria-label="Reward settings">
          <div className="reward-setup__summary-values">
            <div>
              <span>Rewarding</span>
              <strong>
                {rewardTargetKind === "team" ? "Teams" : "Individual players"}
              </strong>
            </div>
            <div>
              <span>Points per winner</span>
              <strong>{rewardPoints}</strong>
            </div>
            <Button
              type="button"
              variant="text"
              fullWidth={false}
              aria-expanded={editingSettings}
              aria-controls={settingsId}
              disabled={busy}
              onClick={() => {
                if (editingSettings && !pointsInput.current?.reportValidity())
                  return;
                setEditingSettings((editing) => !editing);
              }}
            >
              {editingSettings ? "Done" : "Edit"}
              <span className="u-visually-hidden"> reward settings</span>
            </Button>
          </div>
          <div
            id={settingsId}
            className="reward-setup__edit-fields"
            hidden={!editingSettings}
          >
            {editingSettings && rewardSettings}
          </div>
        </div>
      ) : (
        rewardSettings
      )}
      {roundChanged && (
        <Note variant="session">
          The current round changed. Close and reopen review to continue.
        </Note>
      )}
      <Note variant="session">
        The player screens will switch to the selected reward flow until you
        release them back to the game. If the vote is tied, every top-voted
        player/team wins.
      </Note>
      <ControlRow variant="reward">
        <Button
          type="button"
          variant={currentRoundOnly ? "comic-secondary" : "session-ghost"}
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
            busy ||
            roundChanged ||
            !(currentRoundOnly ? currentChallenge : rewardChallengeId) ||
            !enabledRewardMethods.includes(rewardMethod)
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
`;export{e as default};