import LobbyJoinInfo from "./LobbyJoinInfo";
import type { GameSession } from "./types";

interface Props {
  session: GameSession;
  joinUrl: string;
  copyCode: () => Promise<void>;
  copyLink: () => Promise<void>;
  codeCopied: boolean;
  linkCopied: boolean;
}
export default function LobbyInviteStep({
  session,
  joinUrl,
  copyCode,
  copyLink,
  codeCopied,
  linkCopied,
}: Props) {
  return (
    <div data-tour="host-lobby-invite" className="lobby-invite">
      <p>Share the code, QR code or game link with your friends to join.</p>
      <LobbyJoinInfo
        code={session.join_code}
        joinUrl={joinUrl}
        copyCode={copyCode}
        copyLink={copyLink}
        codeCopied={codeCopied}
        linkCopied={linkCopied}
      />
    </div>
  );
}
