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
  onOpenHostJoin,
  copied = false,
  playerCount,
  playerLimit,
  teamsEnabled,
  hostChoosesTeams,
  bare = false,
}: {
  joinUrl: string;
  onCopy: () => void | Promise<void>;
  onOpenHostJoin?: () => void;
  copied?: boolean;
  playerCount: number;
  playerLimit: number;
  teamsEnabled: boolean;
  hostChoosesTeams: boolean;
  bare?: boolean;
}) {
  const content = (
    <>
      {!bare && (
        <Overline as="div" variant="session">
          INVITE PLAYERS
        </Overline>
      )}
      <p>Players can scan this QR code or enter the join code.</p>
      <QrFrame variant="host">
        <QRCodeSVG value={joinUrl} size={196} level="M" marginSize={4} />
      </QrFrame>
      <div className="session-invite__actions">
        <Button
          type="button"
          variant="session-secondary"
          fullWidth={false}
          onClick={() => void onCopy()}
          aria-label={copied ? "Join code copied" : "Copy join code"}
        >
          <Icon
            name={copied ? "check" : "clipboard"}
            className="icon--size-16"
          />{" "}
          Copy join code
        </Button>
        {onOpenHostJoin && (
          <Button
            type="button"
            variant="session-ghost"
            fullWidth={false}
            onClick={onOpenHostJoin}
          >
            Open join screen{" "}
            <Icon name="arrow-right" className="icon--size-16" />
          </Button>
        )}
        <ButtonLink
          variant="session-ghost"
          fullWidth={false}
          href={joinUrl}
          target="_blank"
          rel="noreferrer"
        >
          Open player join page{" "}
          <Icon name="arrow-right" className="icon--size-16" />
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
    </>
  );
  return bare ? (
    <div className="session-invite">{content}</div>
  ) : (
    <ContentPanel variant="session" className="session-invite">
      {content}
    </ContentPanel>
  );
}
