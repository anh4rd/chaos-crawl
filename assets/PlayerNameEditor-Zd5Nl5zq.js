var e=`import PlayerNameForm from "./PlayerNameForm";
import { usePlayerNameEditor } from "./usePlayerNameEditor";
export default function PlayerNameEditor(props: {
  playerId: string;
  name: string;
  reload: () => Promise<void>;
}) {
  const { draft, saved, setDraft, saving, error, inputId, save } =
    usePlayerNameEditor(props);
  return (
    <PlayerNameForm
      name={props.name}
      draft={draft}
      saved={saved}
      saving={saving}
      error={error}
      inputId={inputId}
      onDraft={setDraft}
      onSubmit={save}
    />
  );
}
`;export{e as default};