var e=`import PageFrame from "../../components/ui/PageFrame";
import Button from "../../components/ui/Button";

export default function PlayerRecovery({ onJoin }: { onJoin: () => void }) {
  return (
    <PageFrame variant="compact">
      <h1 className="player-recovery__title">Join the game to take part</h1>
      <p>
        Your player session was not found. Join again to save challenge
        completions and uploads.
      </p>
      <Button type="button" onClick={onJoin}>
        Join Game
      </Button>
    </PageFrame>
  );
}
`;export{e as default};