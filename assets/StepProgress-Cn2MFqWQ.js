var e=`export default function StepProgress({
  value,
  total,
  variant,
}: {
  value: number;
  total: number;
  variant?: "console" | "join";
}) {
  const Bar = variant === "console" || variant === "join" ? "span" : "i";
  return (
    <div
      className={\`step-progress\${variant ? \` step-progress--\${variant}\` : ""}\`}
      role={variant === "join" ? "progressbar" : undefined}
      aria-label={variant === "join" ? "Join progress" : undefined}
      aria-valuemin={variant === "join" ? 0 : undefined}
      aria-valuemax={variant === "join" ? total : undefined}
      aria-valuenow={variant === "join" ? value : undefined}
      aria-valuetext={
        variant === "join" ? \`Step \${value} of \${total}\` : undefined
      }
    >
      <Bar style={{ width: \`\${(value / total) * 100}%\` }} />
    </div>
  );
}
`;export{e as default};