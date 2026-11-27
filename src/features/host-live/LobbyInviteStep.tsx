import LobbyJoinInfo from "./LobbyJoinInfo";
import type { GameSession } from "./types";

interface Props {
  session: GameSession;
  joinUrl: string;
  invitationUrl: string;
  invitationEnabled: boolean | null;
  copyCode: () => Promise<void>;
  copyLink: () => Promise<void>;
  copyInvitation: () => Promise<void>;
  codeCopied: boolean;
  linkCopied: boolean;
  invitationCopied: boolean;
}
export default function LobbyInviteStep({
  session,
  joinUrl,
  invitationUrl,
  invitationEnabled,
  copyCode,
  copyLink,
  copyInvitation,
  codeCopied,
  linkCopied,
  invitationCopied,
}: Props) {
  return (
    <div data-tour="host-lobby-invite" className="lobby-invite">
      <p>Share the code, QR code or game link with your friends to join.</p>
      <LobbyJoinInfo
        code={session.join_code}
        joinUrl={joinUrl}
        invitationUrl={invitationUrl}
        invitationEnabled={invitationEnabled}
        copyCode={copyCode}
        copyLink={copyLink}
        copyInvitation={copyInvitation}
        codeCopied={codeCopied}
        linkCopied={linkCopied}
        invitationCopied={invitationCopied}
      />
    </div>
  );
}
