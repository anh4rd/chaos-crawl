import { challengeIcon } from "../../lib/challengeVisuals";
export default function ChallengeIcons({
  tasks,
}: {
  tasks: Array<{ id?: string; title: string; description?: string }>;
}) {
  if (tasks.length === 0) return null;
  return (
    <div className="challenge-icons" aria-label="Challenges in this game">
      {tasks.slice(0, 4).map((task, index) => (
        <span key={task.id ?? `${task.title}-${index}`} title={task.title}>
          {challengeIcon(task.title, task.description)}
        </span>
      ))}
    </div>
  );
}
