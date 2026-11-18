import { useState } from "react";
import PrivateMissionDialog from "../session-player/PrivateMissionDialog";
import type { SecretMission } from "../session-player/types";
import Button from "../../components/ui/Button";
import Note from "../../components/ui/Note";
import { Example } from "./Example";

const mission: SecretMission = {
  assignment_id: "sample-private",
  challenge_id: "sample-private-challenge",
  title: "Start a sample conga line",
  description:
    "Invite a friend to dance. This preview only changes local state.",
  points: 30,
  duration_minutes: 5,
  status: "sent",
  scheduled_at: "2030-01-01T12:00:00Z",
  sent_at: "2030-01-01T12:00:00Z",
  submitted_at: null,
  reviewed_at: null,
  awarded_points: 0,
  allow_photo_upload: false,
};

export default function PrivateMissionExample() {
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  return (
    <Example
      title="Private mission announcement"
      source="src/features/session-player/PrivateMissionDialog.tsx + src/components/ui/"
      code={
        "<PrivateMissionDialog activeSecretMission={mission} playSecretMission={onAccept} />\n// Accept explicitly with Play; no Escape/backdrop acknowledgement."
      }
    >
      <Button
        variant="poster-primary"
        fullWidth={false}
        type="button"
        onClick={() => setOpen(true)}
      >
        Open sample private mission
      </Button>
      <Note as="output">
        {accepted
          ? "Sample private mission accepted."
          : "Accept the sample with Play. This reference stores no game data."}
      </Note>
      {open && (
        <PrivateMissionDialog
          activeSecretMission={mission}
          playSecretMission={() => {
            setAccepted(true);
            setOpen(false);
          }}
        />
      )}
    </Example>
  );
}
