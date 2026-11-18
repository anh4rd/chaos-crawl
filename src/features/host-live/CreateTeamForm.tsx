import type { FormEvent } from "react";
import Button from "../../components/ui/Button";
import TeamNameForm from "../../components/session/TeamNameForm";
export default function CreateTeamForm({
  teamName,
  setTeamName,
  teamCount,
  busy,
  createTeam,
}: {
  teamName: string;
  setTeamName: (name: string) => void;
  teamCount: number;
  busy: boolean;
  createTeam: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <TeamNameForm
      teamName={teamName}
      setTeamName={setTeamName}
      placeholder={`Team ${teamCount + 1}`}
      onSubmit={(event) => void createTeam(event)}
    >
      <Button
        variant="lobby-add"
        fullWidth={false}
        type="submit"
        disabled={busy || !teamName.trim()}
      >
        + Add team
      </Button>
    </TeamNameForm>
  );
}
