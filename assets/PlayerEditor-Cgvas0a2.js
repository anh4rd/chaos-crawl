var e=`import { useLayoutEffect, useRef, useState, type FormEvent } from "react";
import Button from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import FormStack from "../../components/ui/FormStack";
import type {
  PlatformPlayer,
  PlatformPlayerUpdate,
  PlatformSessionPlayers,
} from "../../types/superAdmin";

export default function PlayerEditor({
  player,
  teams,
  busy,
  onCancel,
  onSave,
}: {
  player: PlatformPlayer;
  teams: PlatformSessionPlayers["teams"];
  busy: boolean;
  onCancel: () => void;
  onSave: (values: PlatformPlayerUpdate) => Promise<void>;
}) {
  const [name, setName] = useState(player.name);
  const [avatar, setAvatar] = useState(player.avatar_url ?? "");
  const [team, setTeam] = useState(player.team_id ?? "");
  const [score, setScore] = useState(String(player.score));
  const [phone, setPhone] = useState(player.phone ?? "");
  const nameInput = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    nameInput.current?.focus();
  }, []);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSave({
      name: name.trim(),
      avatar_url: avatar.trim() || null,
      team_id: team || null,
      score: Number(score),
      phone: player.phone === null ? null : phone,
    });
  }
  return (
    <FormStack onSubmit={submit}>
      <h3>Edit {player.name}</h3>
      <p>
        Joined: {player.joined_at} · Last seen: {player.last_seen_at}
      </p>
      <Field label="Player name">
        <input
          required
          ref={nameInput}
          disabled={busy}
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field label="Avatar URL">
        <input
          type="url"
          disabled={busy}
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
        />
      </Field>
      <Field label="Team">
        <select
          disabled={busy}
          value={team}
          onChange={(e) => setTeam(e.target.value)}
        >
          <option value="">No team</option>
          {teams.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Score">
        <input
          required
          disabled={busy}
          type="number"
          step={1}
          min={-2147483648}
          max={2147483647}
          value={score}
          onChange={(e) => setScore(e.target.value)}
        />
      </Field>
      {player.phone !== null ? (
        <>
          <Field label="Reconnect phone">
            <input
              required
              disabled={busy}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          <p>Changing this changes the number used to rejoin this game.</p>
        </>
      ) : (
        <p>No editable reconnect phone is available for this player.</p>
      )}
      <Button
        type="button"
        variant="comic-secondary"
        fullWidth={false}
        disabled={busy}
        onClick={onCancel}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        variant="comic-primary"
        fullWidth={false}
        disabled={busy}
      >
        {busy ? "Saving…" : "Save player"}
      </Button>
    </FormStack>
  );
}
`;export{e as default};