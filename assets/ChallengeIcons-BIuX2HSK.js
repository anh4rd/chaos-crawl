var e=`import ChallengeArtwork from "./ChallengeArtwork";
export default function ChallengeIcons({
  tasks,
}: {
  tasks: Array<{
    id?: string;
    title: string;
    description?: string;
    artUrl?: string;
  }>;
}) {
  if (tasks.length === 0) return null;
  return (
    <div className="challenge-icons" aria-label="Challenges in this game">
      {tasks.slice(0, 4).map((task, index) => (
        <span key={task.id ?? \`\${task.title}-\${index}\`} title={task.title}>
          <ChallengeArtwork
            selection={task.artUrl}
            title={task.title}
            description={task.description}
          />
        </span>
      ))}
    </div>
  );
}
`;export{e as default};