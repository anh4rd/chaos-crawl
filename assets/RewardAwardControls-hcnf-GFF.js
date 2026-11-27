var e=`import FormLabel from "../../components/ui/FormLabel";
import ControlRow from "../../components/ui/ControlRow";
import Explainer from "../../components/ui/Explainer";
import CandidateList from "../../components/session/CandidateList";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import SessionCandidate from "../../components/session/SessionCandidate";

interface Props {
  method: "host_awards" | "audience_cheers";
  rewardFinalPoints: number;
  setRewardFinalPoints: (points: number) => void;
  busy: boolean;
  rewardTargetRows: {
    id: string;
    name: string;
    detail: string;
    score: number;
    avatarUrl?: string | null;
  }[];
  selectedRewardWinnerIds: string[];
  toggleRewardWinner: (id: string) => void;
  cancelRewardRound: () => Promise<void>;
  completeRewardRound: () => Promise<void>;
}

export default function RewardAwardControls({
  method,
  rewardFinalPoints,
  setRewardFinalPoints,
  busy,
  rewardTargetRows,
  selectedRewardWinnerIds,
  toggleRewardWinner,
  cancelRewardRound,
  completeRewardRound,
}: Props) {
  return (
    <>
      <Explainer variant="reward">
        <strong>
          {method === "audience_cheers"
            ? "Call out the contenders"
            : "Select the winners"}
        </strong>
        <span>
          {method === "audience_cheers"
            ? "Players' screens explain the rules. Call each name in turn, listen for the loudest cheers, then select the winner or winners below."
            : "Players are waiting on their devices. Select one or more winners below, then confirm the award."}
        </span>
      </Explainer>
      <FormLabel variant="award-points">
        <span>Points to award each winner</span>
        <input
          type="number"
          min={0}
          max={10000}
          value={rewardFinalPoints}
          onChange={(event) => setRewardFinalPoints(Number(event.target.value))}
          disabled={busy}
        />
      </FormLabel>
      <CandidateList>
        {rewardTargetRows.map((candidate) => (
          <SessionCandidate
            key={candidate.id}
            name={candidate.name}
            avatarUrl={candidate.avatarUrl}
            detail={\`\${candidate.detail} · \${candidate.score} pts\`}
            selected={selectedRewardWinnerIds.includes(candidate.id)}
            busy={busy}
            actionLabel="Select winner"
            onSelect={() => toggleRewardWinner(candidate.id)}
          />
        ))}
      </CandidateList>
      <ControlRow variant="reward">
        <Button
          type="button"
          variant="session-ghost"
          fullWidth={false}
          disabled={busy}
          onClick={() => void cancelRewardRound()}
        >
          Cancel flow
        </Button>
        <Button
          type="button"
          variant="session-action"
          fullWidth={false}
          disabled={busy || selectedRewardWinnerIds.length === 0}
          onClick={() => void completeRewardRound()}
        >
          <Icon name="check" className="icon--size-16" /> Confirm winners &
          award points
        </Button>
      </ControlRow>
    </>
  );
}
`;export{e as default};