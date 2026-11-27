import CountBadge from "./CountBadge";
import Avatar from "./Avatar";
export default function RankingRow({
  rank,
  name,
  score,
  avatarUrl,
}: {
  rank: number;
  name: string;
  score: number;
  avatarUrl?: string | null;
}) {
  return (
    <div className="ranking-row">
      <CountBadge variant={rank === 1 ? "console-rank-first" : "console-rank"}>
        {rank}
      </CountBadge>
      {avatarUrl && (
        <Avatar name={name} imageSrc={avatarUrl} variant="compact" />
      )}
      <span className="ranking-row__name">{name}</span>
      <strong>
        {score} <small>pts</small>
      </strong>
    </div>
  );
}
