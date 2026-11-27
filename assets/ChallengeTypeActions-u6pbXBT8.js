var e=`import Button from "../../components/ui/Button";
import type { Task, TaskKind } from "./types";

const kinds: { value: TaskKind; label: string }[] = [
  { value: "main", label: "main challenge" },
  { value: "side", label: "side challenge" },
  { value: "secret", label: "secret mission" },
];

export default function ChallengeTypeActions({
  task,
  onChange,
  currentKind = task.kind,
  inPlan = true,
}: {
  task: Task;
  onChange: (task: Task, kind: TaskKind) => void;
  currentKind?: TaskKind;
  inPlan?: boolean;
}) {
  return (
    <fieldset className="challenge-type-actions">
      <legend className="u-visually-hidden">
        Challenge type for {task.title}
      </legend>
      {kinds
        .filter((kind) => kind.value !== currentKind)
        .map((kind) => (
          <Button
            key={kind.value}
            type="button"
            variant="setup-secondary"
            fullWidth={false}
            aria-label={\`\${inPlan ? "Change" : "Add"} \${task.title} \${inPlan ? "to" : "as"} \${kind.label}\`}
            onClick={() => onChange(task, kind.value)}
          >
            {inPlan ? "Change to" : "Add as"} {kind.label}
          </Button>
        ))}
    </fieldset>
  );
}
`;export{e as default};