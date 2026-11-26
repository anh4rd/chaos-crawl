var e=`import StepProgress from "./StepProgress";

export default function JoinProgress({
  step,
  total,
}: {
  step: number;
  total: number;
}) {
  return (
    <div className="join-progress">
      <span>Join progress</span>
      <StepProgress variant="join" value={step} total={total} />
    </div>
  );
}
`;export{e as default};