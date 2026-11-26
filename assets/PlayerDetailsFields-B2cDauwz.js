var e=`import ContentPanel from "../../components/ui/ContentPanel";
import FormLabel from "../../components/ui/FormLabel";
import InputIcon from "../../components/ui/InputIcon";
import Note from "../../components/ui/Note";
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
        <ContentPanel as="div" variant="access-field">
          <FormLabel variant="access" htmlFor="join-name">
            Your name?
          </FormLabel>
          <InputIcon
            icon="users"
            variant="access"
            iconClassName="icon--size-17"
          >
            <input
              id="join-name"
              autoComplete="given-name"
              placeholder="Enter your name"
              maxLength={60}
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              required
            />
          </InputIcon>
        </ContentPanel>
      )}
      <ContentPanel as="div" variant="access-field">
        <FormLabel variant="access" htmlFor="join-mobile">
          Your phone number?
        </FormLabel>
        <Note variant="access-help">
          Used only to reconnect you to this game. No SMS is sent.
        </Note>
        <InputIcon icon="users" variant="access" iconClassName="icon--size-17">
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
        </InputIcon>
      </ContentPanel>
    </>
  );
}
`;export{e as default};