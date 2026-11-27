import { useId, useState } from "react";
import LobbyJoinInfo from "./LobbyJoinInfo";

export default function LobbyJoinDisclosure({
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
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  return (
    <div className="lobby-setup__join-disclosure">
      <button
        className="lobby-setup__join-toggle"
        type="button"
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Hide Join Info" : "Show Join Info"}
      </button>
      <div className="lobby-setup__join-details" id={detailsId} hidden={!open}>
        <LobbyJoinInfo
          code={code}
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
    </div>
  );
}
