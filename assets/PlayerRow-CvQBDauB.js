var e=`import IconButton from "../../components/ui/IconButton";
import Avatar from "../../components/ui/Avatar";
import FormLabel from "../../components/ui/FormLabel";
import type { PlayerRowModel } from "./types";
export default function PlayerRow({
  player,
  teams,
}: {
  player: PlayerRowModel;
  teams: string[];
}) {
  return (
    <article className="roster-row" data-roster-player-id={player.id}>
      <Avatar
        as="div"
        variant="console"
        name={player.initial}
        imageSrc={player.avatarUrl}
        aria-hidden="true"
      />
      <div className="roster-row__controls">
        <input
          aria-label={\`Rename \${player.name}\`}
          className="roster-row__name"
          defaultValue={player.name}
          key={\`\${player.id}-\${player.name}\`}
          onBlur={(event) => void player.onRename(event.target.value)}
        />
        <FormLabel variant="console-team">
          <span>Team</span>
          <select
            value={player.team}
            onChange={(event) => void player.onAssignTeam(event.target.value)}
          >
            <option value="">Unassigned</option>
            {teams.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </FormLabel>
      </div>
      <IconButton
        type="button"

        variant="console-remove"
        label={\`Remove \${player.name}\`}
        onClick={player.onRemove}
        icon="x"
        iconClassName="icon--size-16"
      />
    </article>
  );
}
`;export{e as default};