import { useState } from "react";
import ContentPanel from "../../components/ui/ContentPanel";
import Note from "../../components/ui/Note";
import HostManagement from "../host-live/HostManagement";
import MissionAssignmentForm from "../host-live/MissionAssignmentForm";
import MissionCreationForm from "../host-live/MissionCreationForm";
import { Example } from "./Example";
import SessionPreview from "../../components/session/SessionPreview";

export default function MissionFormsExample() {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(
    "Local forms do not create or assign missions.",
  );
  const [form, setForm] = useState({
    playerId: "pat",
    challengeId: "mission",
    scheduleAt: "",
    title: "",
    description: "",
    points: 10,
    evidence: false,
    textAnswer: false,
  });
  function update(values: Partial<typeof form>) {
    setForm((current) => ({ ...current, ...values }));
  }
  return (
    <Example
      title="Shared mission form controls"
      source="src/features/host-live/MissionAssignmentForm.tsx + MissionCreationForm.tsx"
      code={
        '<FormLabel variant="session">\n  <span>Mission title</span>\n  <input required />\n</FormLabel>\n<Disclosure variant="session" summary="Add a mission">…</Disclosure>'
      }
    >
      <SessionPreview>
        <HostManagement>
          <ContentPanel
            variant="session"
            stacked
            aria-label="Local mission forms"
          >
            <MissionAssignmentForm
              assignSecretMission={async (event) => {
                event.preventDefault();
                setNotice("Sample mission assignment selected locally.");
              }}
              selectedSecretPlayerId={form.playerId}
              setSelectedSecretPlayerId={(value) => update({ playerId: value })}
              busy={busy}
              players={[{ id: "pat", name: "Pat" }]}
              selectedSecretChallengeId={form.challengeId}
              setSelectedSecretChallengeId={(value) =>
                update({ challengeId: value })
              }
              secretChallenges={[
                { id: "mission", title: "Local mission", points: 10 },
              ]}
              secretScheduleAt={form.scheduleAt}
              setSecretScheduleAt={(value) => update({ scheduleAt: value })}
            />
            <MissionCreationForm
              createSecretChallenge={async (event) => {
                event.preventDefault();
                setNotice("Sample mission creation selected locally.");
              }}
              newSecretTitle={form.title}
              setNewSecretTitle={(value) => update({ title: value })}
              newSecretDescription={form.description}
              setNewSecretDescription={(value) =>
                update({ description: value })
              }
              newSecretPoints={form.points}
              setNewSecretPoints={(value) => update({ points: value })}
              newSecretEvidenceRequired={form.evidence}
              setNewSecretEvidenceRequired={(value) =>
                update({ evidence: value })
              }
              newSecretTextAnswer={form.textAnswer}
              setNewSecretTextAnswer={(value) => update({ textAnswer: value })}
              busy={busy}
            />
          </ContentPanel>
        </HostManagement>
      </SessionPreview>
      <label>
        <input
          type="checkbox"
          checked={busy}
          onChange={(event) => setBusy(event.target.checked)}
        />{" "}
        Sample mission forms busy
      </label>
      <Note as="output">{notice}</Note>
    </Example>
  );
}
