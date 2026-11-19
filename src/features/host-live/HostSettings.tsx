import type { FormEvent } from "react";
import { useState } from "react";
import Button from "../../components/ui/Button";
import ButtonLink from "../../components/ui/ButtonLink";
import ContentPanel from "../../components/ui/ContentPanel";
import { Field } from "../../components/ui/Field";
import FormGrid from "../../components/ui/FormGrid";
import PanelHeading from "../../components/ui/PanelHeading";
import Overline from "../../components/ui/Overline";
import { Toggle } from "../../components/ui/Toggle";
import type {
  HostSessionSettings,
  RewardMethod,
} from "../../types/hostSession";
import type { GameSession } from "./types";

type SettingsDraft = Omit<
  HostSessionSettings,
  "event_date" | "start_time" | "end_time" | "venue_name"
> & {
  event_date: string;
  start_time: string;
  end_time: string;
  venue_name: string;
};

const rewardMethods: { value: RewardMethod; label: string }[] = [
  { value: "voting", label: "Player voting" },
  { value: "host_awards", label: "Host awards" },
  { value: "audience_cheers", label: "Audience cheers" },
];

function initialDraft(session: GameSession): SettingsDraft {
  return {
    name: session.name,
    event_date: session.event_date?.slice(0, 10) ?? "",
    start_time: session.start_time?.slice(0, 5) ?? "",
    end_time: session.end_time?.slice(0, 5) ?? "",
    venue_name: session.venue_name ?? "",
    player_limit: session.player_limit,
    teams_enabled: session.teams_enabled,
    host_chooses_teams: session.host_chooses_teams,
    team_size: session.team_size,
    reward_methods: [...session.reward_methods],
  };
}

export default function HostSettings({
  session,
  playerCount,
  busy,
  onSave,
  onHostParticipationChange,
}: {
  session: GameSession;
  playerCount: number;
  busy: boolean;
  onSave: (values: HostSessionSettings) => Promise<void>;
  onHostParticipationChange: (participates: boolean) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState(() => initialDraft(session));
  const readOnly = session.status === "completed";
  const update = <K extends keyof SettingsDraft>(
    key: K,
    value: SettingsDraft[K],
  ) => setDraft((current) => ({ ...current, [key]: value }));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSave({
      ...draft,
      name: draft.name.trim(),
      event_date: draft.event_date || null,
      start_time: draft.start_time || null,
      end_time: draft.end_time || null,
      venue_name: draft.venue_name.trim() || null,
    });
  }

  function toggleRewardMethod(method: RewardMethod, enabled: boolean) {
    update(
      "reward_methods",
      enabled
        ? [...draft.reward_methods, method]
        : draft.reward_methods.filter((value) => value !== method),
    );
  }

  return (
    <ContentPanel variant="session" stacked>
      <PanelHeading variant="session">
        <div>
          <Overline as="div" variant="session">
            GAME SETTINGS
          </Overline>
          <h2>Session settings</h2>
          <p>
            {readOnly
              ? "Session settings are read-only after the game is complete."
              : "Changes here are saved to this active game session."}
          </p>
        </div>
      </PanelHeading>

      <fieldset className="host-settings__fields" disabled={readOnly}>
        <legend>Active session details</legend>
        <Toggle
          title="Host participates"
          detail="Joining or leaving the player list also updates your host player access."
          checked={session.host_participates}
          onChange={(value) => void onHostParticipationChange(value)}
        />

        <form onSubmit={submit}>
          <FormGrid>
            <Field label="Game name">
              <input
                required
                maxLength={100}
                pattern=".*\S.*"
                value={draft.name}
                onChange={(event) => update("name", event.target.value)}
              />
            </Field>
            <Field label="Event date">
              <input
                type="date"
                value={draft.event_date}
                onChange={(event) => update("event_date", event.target.value)}
              />
            </Field>
            <Field label="Start time">
              <input
                type="time"
                value={draft.start_time}
                onChange={(event) => update("start_time", event.target.value)}
              />
            </Field>
            <Field label="Ideal end time">
              <input
                type="time"
                value={draft.end_time}
                onChange={(event) => update("end_time", event.target.value)}
              />
            </Field>
            <Field label="Venue">
              <input
                maxLength={160}
                value={draft.venue_name}
                onChange={(event) => update("venue_name", event.target.value)}
              />
            </Field>
            <Field label="Player limit">
              <input
                type="number"
                min={Math.max(2, playerCount)}
                max={100}
                value={draft.player_limit}
                onChange={(event) =>
                  update("player_limit", Number(event.target.value))
                }
              />
            </Field>
          </FormGrid>

          <Toggle
            title="Use teams"
            detail="Players compete in teams instead of individually."
            checked={draft.teams_enabled}
            onChange={(value) => update("teams_enabled", value)}
          />
          {draft.teams_enabled && (
            <FormGrid>
              <Field label="Players per team">
                <input
                  type="number"
                  min={2}
                  max={6}
                  value={draft.team_size}
                  onChange={(event) =>
                    update("team_size", Number(event.target.value))
                  }
                />
              </Field>
              <Field label="Who assigns teams?">
                <select
                  value={draft.host_chooses_teams ? "host" : "players"}
                  onChange={(event) =>
                    update("host_chooses_teams", event.target.value === "host")
                  }
                >
                  <option value="host">Host assigns teams</option>
                  <option value="players">Players choose teams</option>
                </select>
              </Field>
            </FormGrid>
          )}

          <fieldset className="host-settings__rewards">
            <legend>Reward methods</legend>
            {rewardMethods.map(({ value, label }) => (
              <label key={value}>
                <input
                  type="checkbox"
                  checked={draft.reward_methods.includes(value)}
                  onChange={(event) =>
                    toggleRewardMethod(value, event.target.checked)
                  }
                />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>

          <Button
            type="submit"
            variant="session-action"
            disabled={busy || readOnly}
          >
            {busy ? "Saving…" : "Save session settings"}
          </Button>
        </form>
      </fieldset>

      {session.host_game_id && (
        <div className="host-settings__plan">
          <h3>More Host Hub settings</h3>
          <p>
            Edit the complete saved plan, including challenge selection,
            accessibility, game options, and the planned schedule. Saved-plan
            changes do not rewrite this active session.
          </p>
          <ButtonLink
            variant="session-secondary"
            fullWidth={false}
            to={`/host/games/${session.host_game_id}/edit`}
            target="_blank"
            rel="noreferrer"
          >
            Edit all Host Hub settings
          </ButtonLink>
        </div>
      )}
    </ContentPanel>
  );
}
