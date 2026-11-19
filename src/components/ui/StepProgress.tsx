export default function StepProgress({
  value,
  total,
  variant,
}: {
  value: number;
  total: number;
  variant?: "console";
}) {
  const Bar = variant === "console" ? "span" : "i";
  return (
    <div
      className={`step-progress${variant ? ` step-progress--${variant}` : ""}`}
    >
      <Bar style={{ width: `${(value / total) * 100}%` }} />
    </div>
  );
}
