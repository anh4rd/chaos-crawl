import QrFrame from "../../components/ui/QrFrame";
import Button from "../../components/ui/Button";
import ImageWell from "../../components/ui/ImageWell";
import ContentPanel from "../../components/ui/ContentPanel";
import { QRCodeSVG } from "qrcode.react";
import Icon from "../../components/ui/Icon";
import type { GameSession, SessionPlayer } from "./types";

interface Props {
  gamePhotoUrl: string | null;
  session: GameSession;
  joinUrl: string;
  copyCode: () => Promise<void>;
  players: SessionPlayer[];
}
export default function LobbyInviteStep({
  gamePhotoUrl,
  session,
  joinUrl,
  copyCode,
  players,
}: Props) {
  return (
    <ContentPanel
      data-tour="host-lobby-invite"
      as="div"
      variant="lobby"
      className="lobby-invite"
    >
      <ImageWell variant="badge" imageSrc={gamePhotoUrl}>
        <span aria-hidden="true">🎉</span>
      </ImageWell>
      <h2>{session.name}</h2>
      <p>Share this link with your players to join the game.</p>
      <a
        className="invite-link"
        href={joinUrl}
        target="_blank"
        rel="noreferrer"
      >
        {joinUrl}
        <span>↗</span>
      </a>
      <div className="invite-code">
        <span>
          GAME CODE <strong>{session.join_code}</strong>
        </span>
        <Button
          variant="lobby-action"
          fullWidth={false}
          type="button"
          onClick={() => void copyCode()}
        >
          <Icon name="clipboard" className="icon--size-16" /> Copy code
        </Button>
      </div>
      <QrFrame>
        <QRCodeSVG value={joinUrl} size={190} level="M" marginSize={3} />
      </QrFrame>
      <strong className="lobby-invite__count">
        {players.length} player{players.length === 1 ? "" : "s"} joined so far
      </strong>
    </ContentPanel>
  );
}
