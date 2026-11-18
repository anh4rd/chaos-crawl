import FormStack from "../../components/ui/FormStack";
import FormLabel from "../../components/ui/FormLabel";
import FormGrid from "../../components/ui/FormGrid";
import DialogActions from "../../components/ui/DialogActions";
import Explainer from "../../components/ui/Explainer";
import TagPicker from "../../components/ui/TagPicker";
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
    <FormStack
      variant="contribution"
      onSubmit={(event) => void onSubmit(event)}
    >
      <FormLabel variant="contribution">
        <span>Challenge title</span>
        <input
          required
          maxLength={80}
          value={draft.title}
          onChange={(event) => onDraftChange({ title: event.target.value })}
          placeholder="Give it a memorable name"
        />
      </FormLabel>
      <FormLabel variant="contribution">
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
      </FormLabel>
      <FormGrid variant="contribution">
        <FormLabel variant="contribution">
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
        </FormLabel>
        <FormLabel variant="contribution">
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
        </FormLabel>
        <FormLabel variant="contribution">
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
        </FormLabel>
        <FormLabel variant="contribution">
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
        </FormLabel>
        <FormLabel variant="contribution">
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
        </FormLabel>
        <FormLabel variant="contribution">
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
        </FormLabel>
      </FormGrid>
      <TagPicker
        label="Tags"
        hint="Choose up to 8 that describe your challenge"
        count={<>{draft.tags.length}/8 selected</>}
      >
        {CHALLENGE_TAG_OPTIONS.map((tag) => {
          const selected = draft.tags.includes(tag);
          const disabled = !selected && draft.tags.length >= 8;
          return (
            <Button
              variant="tag-option"
              fullWidth={false}
              key={tag}
              type="button"
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
            </Button>
          );
        })}
      </TagPicker>
      {!editing && (
        <Explainer variant="contribution">
          <Icon name="shield-check" className="icon--size-16" />
          <span>
            Submissions are private until approved by the Chaos Crawl team.
            Approved challenges become visible to all hosts.
          </span>
        </Explainer>
      )}
      <DialogActions variant="contribution">
        <Button
          type="button"
          variant="editor-secondary"
          fullWidth={false}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="editor-primary"
          fullWidth={false}
          disabled={busy}
        >
          {submitLabel}
        </Button>
      </DialogActions>
    </FormStack>
  );
}
