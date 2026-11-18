import Button from "../../components/ui/Button";
import ImageWell from "../../components/ui/ImageWell";
import ContentPanel from "../../components/ui/ContentPanel";
import type { Dispatch, SetStateAction } from "react";
import Icon from "../../components/ui/Icon";
import type { GameSession, SessionPlayer } from "./types";

interface Props {
  gamePhotoUrl: string | null;
  session: GameSession;
  hostAvatarPreview: string;
  setHostAvatarFile: Dispatch<SetStateAction<File | null>>;
  setHostAvatarPreview: Dispatch<SetStateAction<string>>;
  hostJoinChoice: boolean | null;
  busy: boolean;
  setHostParticipation: (participates: boolean) => Promise<boolean>;
  hostPlayer: SessionPlayer | undefined;
}
export default function LobbyParticipationStep({
  gamePhotoUrl,
  session,
  hostAvatarPreview,
  setHostAvatarFile,
  setHostAvatarPreview,
  hostJoinChoice,
  busy,
  setHostParticipation,
  hostPlayer,
}: Props) {
  return (
    <ContentPanel
      data-tour="host-lobby-participation"
      as="div"
      variant="lobby"
      className="lobby-participation"
    >
      <ImageWell variant="badge" imageSrc={gamePhotoUrl}>
        <span aria-hidden="true">🎉</span>
      </ImageWell>
      <h2>{session.name}</h2>
      <h3>Would you like to join the game?</h3>
      <p>
        Join the player list, choose a team and play along. You can still use
        every host control.
      </p>
      <label className="portrait-upload">
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
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            setHostAvatarFile(file);
            setHostAvatarPreview(file ? URL.createObjectURL(file) : "");
          }}
        />
      </label>
      <div className="lobby-participation__choices">
        <Button
          variant="lobby-choice"
          fullWidth={false}
          type="button"
          className={`${hostJoinChoice === true ? " btn--lobby-choice-selected" : ""}`}
          disabled={busy}
          aria-pressed={hostJoinChoice === true}
          onClick={() => void setHostParticipation(true)}
        >
          {busy ? (
            <Icon name="loader-circle" className="icon--size-16 cc-spin" />
          ) : (
            <Icon name="gamepad2" className="icon--size-16" />
          )}{" "}
          Yes, I’ll play
        </Button>
        <Button
          variant="lobby-choice"
          fullWidth={false}
          type="button"
          className={`${hostJoinChoice === false ? " btn--lobby-choice-selected" : ""}`}
          disabled={busy}
          aria-pressed={hostJoinChoice === false}
          onClick={() => void setHostParticipation(false)}
        >
          <Icon name="shield" className="icon--size-16" /> No, I’ll host
        </Button>
      </div>
      {hostPlayer && (
        <p className="lobby-participation__confirmation">
          You’re in as <strong>{hostPlayer.name}</strong>.
        </p>
      )}
    </ContentPanel>
  );
}
