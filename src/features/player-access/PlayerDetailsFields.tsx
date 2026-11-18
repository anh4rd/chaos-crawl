import Icon from "../../components/ui/Icon";
import type { PlayerAccessModel } from "./types";

export default function PlayerDetailsFields({
  mode,
  name,
  mobile,
  onNameChange,
  onMobileChange,
}: Pick<
  PlayerAccessModel,
  "mode" | "name" | "mobile" | "onNameChange" | "onMobileChange"
>) {
  return (
    <>
      {mode === "join" && (
        <div className="join-form-card">
          <label htmlFor="join-name">Your name?</label>
          <div className="join-input-wrap">
            <Icon name="users" className="icon--size-17" />
            <input
              id="join-name"
              autoComplete="given-name"
              placeholder="Enter your name"
              maxLength={60}
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              required
            />
          </div>
        </div>
      )}
      <div className="join-form-card">
        <label htmlFor="join-mobile">Your phone number?</label>
        <p className="join-field-help">
          Used only to reconnect you to this game. No SMS is sent.
        </p>
        <div className="join-input-wrap">
          <Icon name="users" className="icon--size-17" />
          <input
            id="join-mobile"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="Enter your number"
            value={mobile}
            onChange={(event) => onMobileChange(event.target.value)}
            required
          />
        </div>
      </div>
    </>
  );
}
