var e=`import CountBadge from "./CountBadge";
export default function RankingRow({
  rank,
  name,
  score,
}: {
  rank: number;
  name: string;
  score: number;
}) {
  return (
    <div className="ranking-row">
      <CountBadge variant={rank === 1 ? "console-rank-first" : "console-rank"}>
        {rank}
      </CountBadge>
      <span className="ranking-row__name">{name}</span>
      <strong>
        {score} <small>pts</small>
      </strong>
    </div>
  );
}
`;export{e as default};