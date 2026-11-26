var e=`import { QRCodeSVG } from "qrcode.react";
import Icon from "../../components/ui/Icon";
import QrFrame from "../../components/ui/QrFrame";

export default function LobbyJoinInfo({
  code,
  joinUrl,
  copyCode,
  copyLink,
  codeCopied,
  linkCopied,
}: {
  code: string;
  joinUrl: string;
  copyCode: () => Promise<void>;
  copyLink: () => Promise<void>;
  codeCopied: boolean;
  linkCopied: boolean;
}) {
  return (
    <div className="lobby-join-info">
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
`;export{e as default};