var e=`import { type FormEvent } from "react";
import Icon from "../../components/ui/Icon";
import ChoiceOption from "../../components/ui/ChoiceOption";
import TeamNameForm from "../../components/session/TeamNameForm";
import CandidateList from "../../components/session/CandidateList";
import ContentPanel from "../../components/ui/ContentPanel";
import PanelHeading from "../../components/ui/PanelHeading";
import CountBadge from "../../components/ui/CountBadge";
import Overline from "../../components/ui/Overline";
import Button from "../../components/ui/Button";
import type { SessionInfo, SessionPlayerInfo, TeamInfo } from "./types";

interface Props {
  session: SessionInfo;
  teams: TeamInfo[];
  player: SessionPlayerInfo;
  busyKey: string | null;
  chooseTeam: (teamId: string) => Promise<void>;
  createTeam: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  teamName: string;
  setTeamName: (name: string) => void;
  teamPhotoUrls?: Record<string, string>;
}
export default function ParticipantTeams({
  session,
  teams,
  player,
  busyKey,
  chooseTeam,
  createTeam,
  teamName,
  setTeamName,
  teamPhotoUrls = {},
}: Props) {
  return (
    <ContentPanel variant="choice">
      <PanelHeading variant="choice">
        <div>
          <Overline variant="choice">SQUAD UP</Overline>
          <h2>Choose your team</h2>
        </div>
        <CountBadge variant="choice">{session.team_size} max</CountBadge>
      </PanelHeading>
      <CandidateList spaced>
        {teams.map((team) => {
          const selected = player.team_id === team.id;
          const full = team.member_count >= session.team_size && !selected;
          const description = full
            ? "Team full"
            : \`\${team.member_count}/\${session.team_size} players\`;
          return (
            <ChoiceOption
              key={team.id}
              label={team.name}
              imageSrc={teamPhotoUrls[team.id]}
              description={description}
              selected={selected}
              disabled={busyKey !== null || full}
              onClick={() => void chooseTeam(team.id)}
            />
          );
        })}
        <TeamNameForm
          variant="participant"
          teamName={teamName}
          setTeamName={setTeamName}
          placeholder="Or name a new team…"
          onSubmit={(event) => void createTeam(event)}
        >
          <Button
            variant="team-create"
            fullWidth={false}
            type="submit"
            aria-label="Create team"
            aria-busy={busyKey === "create-team"}
            disabled={busyKey !== null || !teamName.trim()}
          >
            {busyKey === "create-team" ? (
              <Icon
                name="loader-circle"
                className="icon--size-17 icon--spinning-session"
              />
            ) : (
              "Create team"
            )}
          </Button>
        </TeamNameForm>
      </CandidateList>
    </ContentPanel>
  );
}
`;export{e as default};