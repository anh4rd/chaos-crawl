import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { renamePlayer } from "../../../lib/playerApi";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";

export default function PlayerNameEditor({
  playerId,
  name,
  reload,
}: {
  playerId: string;
  name: string;
  reload: () => Promise<void>;
}) {
  const [editor, setEditor] = useState({ draft: name, saved: name });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  const inputId = useId();
  useEffect(() => {
    setEditor((current) => ({
      draft: current.draft === current.saved ? name : current.draft,
      saved: name,
    }));
  }, [name]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const cleanName = editor.draft.trim();
    if (!cleanName) {
      setError("Enter a player name.");
      return;
    }
    if (cleanName === editor.saved) return;
    pending.current = true;
    setSaving(true);
    setError(null);
    try {
      const { error: failure } = await renamePlayer(playerId, cleanName);
      if (failure) throw new Error(failure.message);
      setEditor({ draft: cleanName, saved: cleanName });
      await reload();
    } catch (cause) {
      setError(
        `Could not rename player: ${cause instanceof Error ? cause.message : "Unexpected error"}`,
      );
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }
  return (
    <form onSubmit={save} className="space-y-2">
      <label htmlFor={inputId} className="block text-sm">
        Player name
      </label>
      <Input
        id={inputId}
        aria-label={`Name for ${name}`}
        value={editor.draft}
        disabled={saving}
        onChange={(event) =>
          setEditor((current) => ({ ...current, draft: event.target.value }))
        }
      />
      {error && <p role="alert">{error}</p>}
      <Button type="submit" disabled={saving || editor.draft === editor.saved}>
        {saving ? "Saving name..." : "Save Name"}
      </Button>
    </form>
  );
}
