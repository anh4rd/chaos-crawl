import type { FormEvent } from "react";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
export default function PlayerNameForm({
  name,
  draft,
  saved,
  saving,
  error,
  inputId,
  onDraft,
  onSubmit,
}: {
  name: string;
  draft: string;
  saved: string;
  saving: boolean;
  error: string | null;
  inputId: string;
  onDraft: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <label htmlFor={inputId} className="block text-sm">
        Player name
      </label>
      <Input
        id={inputId}
        aria-label={`Name for ${name}`}
        value={draft}
        disabled={saving}
        onChange={(event) => onDraft(event.target.value)}
      />
      {error && <p role="alert">{error}</p>}
      <Button type="submit" disabled={saving || draft === saved}>
        {saving ? "Saving name..." : "Save Name"}
      </Button>
    </form>
  );
}
