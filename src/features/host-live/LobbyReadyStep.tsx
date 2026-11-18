import ImageWell from "../../components/ui/ImageWell";
import ContentPanel from "../../components/ui/ContentPanel";
import type { GameSession, SessionPlayer, SessionTeam } from "./types";

interface Props {
  gamePhotoUrl: string | null;
  session: GameSession;
  readyTeamsCount: number;
  teams: SessionTeam[];
  players: SessionPlayer[];
}
export default function LobbyReadyStep({
  gamePhotoUrl,
  session,
  readyTeamsCount,
  teams,
  players,
}: Props) {
  return (
    <ContentPanel
      data-tour="host-lobby-ready"
      as="div"
      variant="lobby"
      className="lobby-ready"
    >
      <ImageWell variant="poster" imageSrc={gamePhotoUrl}>
        <span aria-hidden="true">🎉</span>
      </ImageWell>
      <span className="lobby-ready__kicker">READY WHEN YOU ARE</span>
      <h2>{session.name}</h2>
      <strong className="lobby-ready__count">
        {session.teams_enabled
          ? `${readyTeamsCount} of ${teams.length} teams ready`
          : `${players.length} players ready`}
      </strong>
      <p>
        Everyone is together. This is a good time to explain the rules, answer
        questions and make sure each team knows how to play.
      </p>
      <div className="lobby-ready__summary">
        {players.length} players ·{" "}
        {session.teams_enabled
          ? `${teams.length} teams · ${session.team_size} players per team`
          : "Individual play"}
      </div>
    </ContentPanel>
  );
}
