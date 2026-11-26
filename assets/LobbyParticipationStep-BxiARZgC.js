var e=`import ImageWell from "../../components/ui/ImageWell";
import type { Dispatch, SetStateAction } from "react";
import Icon from "../../components/ui/Icon";
import type { SessionPlayer } from "./types";

interface Props {
  hostAvatarPreview: string;
  setHostAvatarFile: Dispatch<SetStateAction<File | null>>;
  setHostAvatarPreview: Dispatch<SetStateAction<string>>;
  hostJoinChoice: boolean;
  busy: boolean;
  setHostParticipation: (participates: boolean) => Promise<boolean>;
  hostPlayer: SessionPlayer | undefined;
}
export default function LobbyParticipationStep({
  hostAvatarPreview,
  setHostAvatarFile,
  setHostAvatarPreview,
  hostJoinChoice,
  busy,
  setHostParticipation,
  hostPlayer,
}: Props) {
  return (
    <div data-tour="host-lobby-participation" className="lobby-participation">
      <div className="lobby-participation__card">
        <h3>Would you like to participate as well as host?</h3>
        <label className="lobby-participation__toggle">
          <span>Just host</span>
          <input
            type="checkbox"
            aria-label="Play as host"
            checked={hostJoinChoice}
            aria-disabled={busy}
            onChange={(event) => {
              if (!busy) void setHostParticipation(event.target.checked);
            }}
          />
          <span className="lobby-participation__track" aria-hidden="true" />
          <span>Play</span>
        </label>
      </div>
      <label className="portrait-upload portrait-upload--lobby">
        <ImageWell
          as="span"
          variant="portrait"
          imageSrc={hostAvatarPreview}
          alt="Profile preview"
        >
          <Icon name="users" className="icon--size-27" />
        </ImageWell>
        <span>
          <strong>Upload a profile picture</strong>
          <small>Optional · JPG, PNG or WebP</small>
        </span>
        <input
          type="file"
          aria-label="Upload a profile picture"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            setHostAvatarFile(file);
            setHostAvatarPreview(file ? URL.createObjectURL(file) : "");
          }}
        />
      </label>
      {hostPlayer && (
        <p className="lobby-participation__confirmation">
          You’re in as <strong>{hostPlayer.name}</strong>.
        </p>
      )}
    </div>
  );
}
`;export{e as default};