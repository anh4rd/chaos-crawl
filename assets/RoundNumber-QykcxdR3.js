var e=`export default function RoundNumber({
  round,
  total,
}: {
  round: number;
  total: number;
}) {
  return (
    <div className="round-number">
      {round}
      <span> / {total}</span>
    </div>
  );
}
`;export{e as default};