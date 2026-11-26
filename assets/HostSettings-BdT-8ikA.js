var e=`import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import Button from "../../components/ui/Button";
import ButtonLink from "../../components/ui/ButtonLink";
import Disclosure from "../../components/ui/Disclosure";
import Icon, { type IconName } from "../../components/ui/Icon";
import { Field } from "../../components/ui/Field";
import FormGrid from "../../components/ui/FormGrid";
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
  joinUrl,
  busy,
  onSave,
  onHostParticipationChange,
}: {
  session: GameSession;
  playerCount: number;
  joinUrl?: string;
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
    if (
      affectsLiveGame &&
      !window.confirm(
        "This game is live. Changing teams, player limit or reward methods can affect players right now. Save these changes?",
      )
    )
      return;
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

  const initial = initialDraft(session);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const affectsLiveGame =
    session.status === "live" &&
    (draft.teams_enabled !== initial.teams_enabled ||
      draft.team_size !== initial.team_size ||
      draft.host_chooses_teams !== initial.host_chooses_teams ||
      draft.player_limit !== initial.player_limit ||
      draft.reward_methods.join() !== initial.reward_methods.join());
  const rewardSummary =
    draft.reward_methods
      .map(
        (method) => rewardMethods.find((item) => item.value === method)?.label,
      )
      .join(", ") || "None selected";

  return (
    <form className="host-settings" onSubmit={submit}>
      <p className="host-settings__intro">
        {readOnly
          ? "Session settings are read-only after the game is complete."
          : "Configure how the game works. Changes are saved to this game session."}
      </p>
      <fieldset className="host-settings__fields" disabled={readOnly}>
        <legend className="u-visually-hidden">Active session details</legend>
        <SettingsCategory
          icon="clipboard-list"
          title="Game details"
          description="Name, date, venue and player limit."
          summary={\`\${draft.name || "Untitled"} · \${draft.event_date || "No date"} · limit \${draft.player_limit}\`}
        >
          <FormGrid>
            <Field label="Game name">
              <input
                required
                maxLength={100}
                pattern=".*\\S.*"
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
        </SettingsCategory>

        <SettingsCategory
          icon="users"
          title="Teams & participation"
          description="Teams, team size, assignment and host play."
          summary={\`\${draft.teams_enabled ? \`Teams of \${draft.team_size}\` : "Individual play"} · Host \${session.host_participates ? "plays" : "not playing"}\`}
        >
          <Toggle
            title="Host participates"
            detail="Joining or leaving the player list also updates your host player access."
            checked={session.host_participates}
            onChange={(value) => {
              if (
                session.status === "live" &&
                !window.confirm(
                  "Change host participation during a live game? Your host player access updates immediately.",
                )
              )
                return;
              void onHostParticipationChange(value);
            }}
          />
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
        </SettingsCategory>

        <SettingsCategory
          icon="trophy"
          title="Voting & rewards"
          description="How reward rounds are decided."
          summary={rewardSummary}
        >
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
        </SettingsCategory>

        <SettingsCategory
          icon="settings"
          title="Game flow & scoring"
          description="Rounds, breaks, scoring and secret missions."
          summary={
            session.host_game_id
              ? "Managed in the saved Host Hub plan"
              : "No saved plan linked"
          }
        >
          {session.host_game_id ? (
            <div className="host-settings__plan">
              <p>
                Edit the complete saved plan, including challenge selection,
                accessibility, game options, and the planned schedule.
                Saved-plan changes do not rewrite this active session.
              </p>
              <ButtonLink
                variant="session-secondary"
                fullWidth={false}
                to={\`/host/games/\${session.host_game_id}/edit\`}
                target="_blank"
                rel="noreferrer"
              >
                Edit all Host Hub settings
              </ButtonLink>
            </div>
          ) : (
            <p>This game has no saved plan to configure.</p>
          )}
        </SettingsCategory>

        <SettingsCategory
          icon="send"
          title="Access & sharing"
          description="Join code and invitation link."
          summary={\`Code \${session.join_code}\`}
        >
          <dl className="host-settings__access">
            <div>
              <dt>Join code</dt>
              <dd>{session.join_code}</dd>
            </div>
            {joinUrl && (
              <div>
                <dt>Invitation link</dt>
                <dd>{joinUrl}</dd>
              </div>
            )}
          </dl>
        </SettingsCategory>
      </fieldset>

      <div className="host-settings__save">
        {dirty && (
          <span className="host-settings__dirty" role="status">
            Unsaved changes
          </span>
        )}
        <Button
          type="submit"
          variant="session-action"
          fullWidth={false}
          disabled={busy || readOnly || !dirty}
        >
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function SettingsCategory({
  icon,
  title,
  description,
  summary,
  children,
}: {
  icon: IconName;
  title: string;
  description: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <Disclosure
      variant="session"
      className="host-settings__category"
      summary={
        <span className="host-settings__summary">
          <span className="host-settings__icon">
            <Icon name={icon} className="icon--size-20" aria-hidden="true" />
          </span>
          <span className="host-settings__heading">
            <strong>{title}</strong>
            <small>{description}</small>
            <small className="host-settings__values">{summary}</small>
          </span>
          <Icon
            name="chevron-down"
            className="disclosure-chevron icon--size-20"
            aria-hidden="true"
          />
        </span>
      }
    >
      <div className="host-settings__body">{children}</div>
    </Disclosure>
  );
}
`;export{e as default};