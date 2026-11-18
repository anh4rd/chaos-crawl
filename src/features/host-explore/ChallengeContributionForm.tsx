import type { ReactNode } from "react";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import PlusMark from "./PlusMark";
import { CHALLENGE_TAG_OPTIONS } from "./catalogue";

import type { ContributionFormModel } from "./viewTypes";

export default function ChallengeContributionForm({
  draft,
  editing,
  busy,
  onDraftChange,
  onToggleTag,
  onSubmit,
  onCancel,
}: ContributionFormModel) {
  let submitLabel: ReactNode;
  if (busy) submitLabel = editing ? "Saving…" : "Submitting…";
  else if (editing)
    submitLabel = (
      <>
        <Icon name="check" className="icon--size-15" /> Save changes
      </>
    );
  else
    submitLabel = (
      <>
        <Icon name="send" className="icon--size-15" /> Submit for review
      </>
    );

  return (
    <form
      className="host-community-form"
      onSubmit={(event) => void onSubmit(event)}
    >
      <label>
        <span>Challenge title</span>
        <input
          required
          maxLength={80}
          value={draft.title}
          onChange={(event) => onDraftChange({ title: event.target.value })}
          placeholder="Give it a memorable name"
        />
      </label>
      <label>
        <span>How does it work?</span>
        <textarea
          required
          maxLength={1200}
          rows={4}
          value={draft.description}
          onChange={(event) =>
            onDraftChange({ description: event.target.value })
          }
          placeholder="Explain the challenge and any rules or safety considerations."
        />
      </label>
      <div className="host-community-form-grid">
        <label>
          <span>Challenge type</span>
          <select
            value={draft.kind}
            onChange={(event) => {
              const kind = event.target.value;
              if (kind === "main" || kind === "side" || kind === "secret")
                onDraftChange({ kind });
            }}
          >
            <option value="main">Main challenge</option>
            <option value="side">Side challenge</option>
            <option value="secret">Secret mission</option>
          </select>
        </label>
        <label>
          <span>Points</span>
          <input
            type="number"
            min="0"
            max="100"
            value={draft.points}
            onChange={(event) =>
              onDraftChange({ points: Number(event.target.value) })
            }
          />
        </label>
        <label>
          <span>Minutes</span>
          <input
            type="number"
            min="1"
            max="180"
            value={draft.minutes}
            onChange={(event) =>
              onDraftChange({ minutes: Number(event.target.value) })
            }
          />
        </label>
        <label>
          <span>Player prep (optional)</span>
          <input
            type="number"
            min="0"
            max="180"
            value={draft.prepMinutes ?? 0}
            onChange={(event) =>
              onDraftChange({ prepMinutes: Number(event.target.value) })
            }
          />
        </label>
        <label>
          <span>Player performance (optional)</span>
          <input
            type="number"
            min="0"
            max="180"
            value={draft.performanceMinutes ?? 0}
            onChange={(event) =>
              onDraftChange({ performanceMinutes: Number(event.target.value) })
            }
          />
        </label>
        <label>
          <span>Equipment</span>
          <select
            value={draft.setup}
            onChange={(event) => {
              const setup = event.target.value;
              if (setup === "none" || setup === "basic" || setup === "some")
                onDraftChange({ setup });
            }}
          >
            <option value="none">No kit</option>
            <option value="basic">Basic kit</option>
            <option value="some">Some prep</option>
          </select>
        </label>
      </div>
      <fieldset className="host-community-tag-fieldset">
        <legend>
          Tags <small>Choose up to 8 that describe your challenge</small>
        </legend>
        <div className="host-community-tag-options">
          {CHALLENGE_TAG_OPTIONS.map((tag) => {
            const selected = draft.tags.includes(tag);
            const disabled = !selected && draft.tags.length >= 8;
            return (
              <button
                key={tag}
                type="button"
                className={`host-community-tag-option${selected ? " is-selected" : ""}`}
                aria-pressed={selected}
                disabled={disabled}
                onClick={() => onToggleTag(tag, selected)}
              >
                {selected ? (
                  <Icon name="check" className="icon--size-13" />
                ) : (
                  <PlusMark />
                )}
                {tag}
              </button>
            );
          })}
        </div>
        <small className="host-community-tag-count">
          {draft.tags.length}/8 selected
        </small>
      </fieldset>
      {!editing && (
        <div className="host-community-submit-note">
          <Icon name="shield-check" className="icon--size-16" />
          <span>
            Submissions are private until approved by the Chaos Crawl team.
            Approved challenges become visible to all hosts.
          </span>
        </div>
      )}
      <div className="host-community-modal-actions">
        <Button
          type="button"
          variant="comic-secondary"
          fullWidth={false}
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
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
