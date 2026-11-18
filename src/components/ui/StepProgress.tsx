export default function StepProgress({
  value,
  total,
}: {
  value: number;
  total: number;
}) {
  return (
    <div className="step-progress">
      <i style={{ width: `${(value / total) * 100}%` }} />
    </div>
  );
}
