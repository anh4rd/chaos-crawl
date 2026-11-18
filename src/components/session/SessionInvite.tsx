import { QRCodeSVG } from "qrcode.react";
import ButtonLink from "../ui/ButtonLink";
import Button from "../ui/Button";
import ContentPanel from "../ui/ContentPanel";
import Overline from "../ui/Overline";
import QrFrame from "../ui/QrFrame";
import Note from "../ui/Note";
import Icon from "../ui/Icon";

export default function SessionInvite({
  joinUrl,
  onCopy,
  playerCount,
  playerLimit,
  teamsEnabled,
  hostChoosesTeams,
}: {
  joinUrl: string;
  onCopy: () => void | Promise<void>;
  playerCount: number;
  playerLimit: number;
  teamsEnabled: boolean;
  hostChoosesTeams: boolean;
}) {
  return (
    <ContentPanel variant="session" className="session-invite">
      <Overline as="div" variant="session">
        INVITE PLAYERS
      </Overline>
      <p>
        Players can scan this QR code or enter the code shown in the game
        header.
      </p>
      <QrFrame variant="host">
        <QRCodeSVG value={joinUrl} size={196} level="M" marginSize={4} />
      </QrFrame>
      <div className="session-invite__actions">
        <Button
          type="button"
          variant="session-secondary"
          fullWidth={false}
          onClick={() => void onCopy()}
        >
          <Icon name="clipboard" className="icon--size-16" /> Copy join code
        </Button>
        <ButtonLink
          variant="session-ghost"
          fullWidth={false}
          href={joinUrl}
          target="_blank"
          rel="noreferrer"
        >
          Open join screen <Icon name="arrow-right" className="icon--size-16" />
        </ButtonLink>
      </div>
      <div className="session-invite__count">
        <Icon name="users" className="icon--size-17" /> {playerCount} /{" "}
        {playerLimit} players joined
      </div>
      {teamsEnabled && (
        <Note variant="session">
          {hostChoosesTeams
            ? "You'll assign teams below."
            : "Players can pick or create a team in the lobby."}
        </Note>
      )}
    </ContentPanel>
  );
}
