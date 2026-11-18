import Badge from "../ui/Badge";

export default function VoterList({
  voters,
}: {
  voters: { id: string; name: string; choice: string }[];
}) {
  return (
    <div className="voter-list">
      {voters.map((voter) => (
        <Badge key={voter.id} variant="vote">
          {voter.name} · {voter.choice}
        </Badge>
      ))}
    </div>
  );
}
