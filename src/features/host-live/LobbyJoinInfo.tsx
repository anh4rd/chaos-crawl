import { QRCodeSVG } from "qrcode.react";
import Icon from "../../components/ui/Icon";
import QrFrame from "../../components/ui/QrFrame";

export default function LobbyJoinInfo({
  code,
  joinUrl,
  invitationUrl,
  invitationEnabled,
  copyCode,
  copyLink,
  copyInvitation,
  codeCopied,
  linkCopied,
  invitationCopied,
}: {
  code: string;
  joinUrl: string;
  invitationUrl: string;
  invitationEnabled: boolean | null;
  copyCode: () => Promise<void>;
  copyLink: () => Promise<void>;
  copyInvitation: () => Promise<void>;
  codeCopied: boolean;
  linkCopied: boolean;
  invitationCopied: boolean;
}) {
  return (
    <div className="lobby-join-info">
      {invitationEnabled === true ? (
        <div className="lobby-join-info__invitation">
          <strong>Pre-event invitation</strong>
          <p>
            Share this link before the event for the game details, rules and
            preparation.
          </p>
          <div className="lobby-join-info__link">
            <a href={invitationUrl} target="_blank" rel="noreferrer">
              {invitationUrl}
            </a>
            <button
              className="lobby-join-info__copy-invitation"
              type="button"
              onClick={() => void copyInvitation()}
              aria-label={
                invitationCopied
                  ? "Invitation link copied"
                  : "Copy invitation link"
              }
            >
              <Icon
                name={invitationCopied ? "check" : "copy"}
                className="icon--size-19"
              />
              {invitationCopied ? "Copied" : "Copy invite"}
            </button>
          </div>
        </div>
      ) : (
        <p>
          {invitationEnabled === false
            ? "Pre-event invitations are off. Enable them in the game plan's Invites settings."
            : "Pre-event invitation details are unavailable. Check the saved game plan."}
        </p>
      )}
      <strong>Direct game join</strong>
      <div className="lobby-join-info__code" aria-label="Game code">
        <strong>{code}</strong>
        <button
          type="button"
          onClick={() => void copyCode()}
          aria-label={codeCopied ? "Game code copied" : "Copy game code"}
        >
          <Icon
            name={codeCopied ? "check" : "copy"}
            className="icon--size-19"
          />
        </button>
      </div>
      <div className="lobby-join-info__link">
        <a href={joinUrl} target="_blank" rel="noreferrer">
          {joinUrl}
        </a>
        <button
          type="button"
          onClick={() => void copyLink()}
          aria-label={linkCopied ? "Game link copied" : "Copy game link"}
        >
          <Icon
            name={linkCopied ? "check" : "copy"}
            className="icon--size-19"
          />
        </button>
      </div>
      <QrFrame>
        <QRCodeSVG
          value={joinUrl}
          size={190}
          level="M"
          marginSize={3}
          title="QR code to join the game"
        />
      </QrFrame>
    </div>
  );
}
