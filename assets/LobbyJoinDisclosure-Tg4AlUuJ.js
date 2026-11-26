var e=`import { useId, useState } from "react";
import LobbyJoinInfo from "./LobbyJoinInfo";

export default function LobbyJoinDisclosure({
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
          copyCode={copyCode}
          copyLink={copyLink}
          codeCopied={codeCopied}
          linkCopied={linkCopied}
        />
      </div>
    </div>
  );
}
`;export{e as default};