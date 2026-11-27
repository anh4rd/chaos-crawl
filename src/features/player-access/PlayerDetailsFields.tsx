import ContentPanel from "../../components/ui/ContentPanel";
import FormLabel from "../../components/ui/FormLabel";
import InputIcon from "../../components/ui/InputIcon";
import Note from "../../components/ui/Note";
import type { PlayerAccessModel } from "./types";

export default function PlayerDetailsFields({
  mode,
  name,
  mobile,
  credential,
  onNameChange,
  onMobileChange,
  onCredentialChange,
}: Pick<
  PlayerAccessModel,
  | "mode"
  | "name"
  | "mobile"
  | "credential"
  | "onNameChange"
  | "onMobileChange"
  | "onCredentialChange"
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
      {mode === "join" ? (
        <ContentPanel as="div" variant="access-field">
          <FormLabel variant="access" htmlFor="join-mobile">
            Your phone number?
          </FormLabel>
          <Note variant="access-help">
            No SMS is sent. Your recovery code is needed to reconnect.
          </Note>
          <InputIcon
            icon="users"
            variant="access"
            iconClassName="icon--size-17"
          >
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
      ) : (
        <ContentPanel as="div" variant="access-field">
          <FormLabel variant="access" htmlFor="recovery-credential">
            Recovery code
          </FormLabel>
          <input
            id="recovery-credential"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={credential}
            onChange={(event) => onCredentialChange(event.target.value)}
            required
          />
          <Note variant="access-help">
            Enter the private code saved when you joined.
          </Note>
        </ContentPanel>
      )}
    </>
  );
}
