import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { renamePlayer } from "../../../lib/playerApi";
import { useAdminLifetime } from "../useAdminLifetime";
export function usePlayerNameEditor({
  playerId,
  name,
  reload,
}: {
  playerId: string;
  name: string;
  reload: () => Promise<void>;
}) {
  const captureLifetime = useAdminLifetime();
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
    const current = captureLifetime();
    if (!current() || pending.current) return;
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
      if (!current()) return;
      if (failure) throw new Error(failure.message);
      setEditor({ draft: cleanName, saved: cleanName });
      await reload();
    } catch (cause) {
      if (!current()) return;
      setError(
        `Could not rename player: ${cause instanceof Error ? cause.message : "Unexpected error"}`,
      );
    } finally {
      if (current()) {
        pending.current = false;
        setSaving(false);
      }
    }
  }
  return {
    draft: editor.draft,
    saved: editor.saved,
    setDraft: (draft: string) =>
      setEditor((current) => ({ ...current, draft })),
    saving,
    error,
    inputId,
    save,
  };
}
