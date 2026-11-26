var e=`import IconButton from "../../components/ui/IconButton";
import MetadataList from "../../components/ui/MetadataList";
import MetadataItem from "../../components/ui/MetadataItem";
import TagList from "../../components/ui/TagList";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import ControlRow from "../../components/ui/ControlRow";
import PlusMark from "./PlusMark";

import type { TaskCardModel } from "./viewTypes";

export default function TaskCard({
  task,
  saved,
  busy,
  onToggleSaved,
  onAdd,
  adminActions,
}: TaskCardModel) {
  let kindLabel = "Secret mission";
  if (task.kind === "main") kindLabel = "Main challenge";
  else if (task.kind === "side") kindLabel = "Side challenge";
  let setupLabel = "Some prep";
  if (task.setup === "none") setupLabel = "No kit";
  else if (task.setup === "basic") setupLabel = "Basic kit";

  return (
    <Card
      as="article"
      variant="idea"
      header={
        <>
          <Badge variant={\`idea-\${task.kind}\`}>{kindLabel}</Badge>
          <IconButton
            type="button"
            variant={saved ? "idea-saved" : "idea-save"}
            icon={saved ? "bookmark-check" : "heart"}
            disabled={busy}
            onClick={() => onToggleSaved()}
            label={saved ? \`Unsave \${task.title}\` : \`Save \${task.title}\`}
            title={saved ? "Saved" : "Save for later"}
          />
        </>
      }
    >
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      <MetadataList>
        {task.prepMinutes || task.performanceMinutes ? (
          <>
            <MetadataItem icon="clock3">
              Prep {task.prepMinutes ?? 0} min
            </MetadataItem>
            <MetadataItem icon="clock3">
              Performance {task.performanceMinutes ?? 0} min
            </MetadataItem>
          </>
        ) : (
          <MetadataItem icon="clock3">{task.minutes} min</MetadataItem>
        )}
        <MetadataItem icon="sparkles">{task.points} points</MetadataItem>
        <MetadataItem icon="wallet">{setupLabel}</MetadataItem>
      </MetadataList>
      <TagList variant="idea">
        {task.tags.slice(0, 4).map((tag) => (
          <Badge variant="tag" key={tag}>
            {tag}
          </Badge>
        ))}
      </TagList>
      {adminActions && (
        <ControlRow variant="moderation">
          <Button
            type="button"
            variant="moderation-secondary"
            fullWidth={false}
            onClick={() => adminActions.onEdit()}
          >
            Edit challenge
          </Button>
          <Button
            type="button"
            variant="moderation-secondary"
            fullWidth={false}
            disabled={adminActions.busy}
            onClick={() => adminActions.onDelete()}
          >
            Delete
          </Button>
        </ControlRow>
      )}
      <ControlRow variant="idea-actions">
        <Button
          type="button"
          variant="idea-add"
          fullWidth={false}
          onClick={() => onAdd("main")}
        >
          <PlusMark /> Add as main
        </Button>
        <Button
          type="button"
          variant="idea-add-secondary"
          fullWidth={false}
          onClick={() => onAdd("side")}
        >
          <PlusMark /> Add as side
        </Button>
      </ControlRow>
    </Card>
  );
}
`;export{e as default};