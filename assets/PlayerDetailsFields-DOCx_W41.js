var e=`import ContentPanel from "../../components/ui/ContentPanel";
import FormLabel from "../../components/ui/FormLabel";
import InputIcon from "../../components/ui/InputIcon";
import Note from "../../components/ui/Note";
import type { PlayerAccessModel } from "./types";

export default function PlayerDetailsFields({
  mode,
  name,
  mobile,
  countryCode,
  customCountryCode,
  credential,
  onNameChange,
  onMobileChange,
  onCountryCodeChange,
  onCustomCountryCodeChange,
  onCredentialChange,
}: Pick<
  PlayerAccessModel,
  | "mode"
  | "name"
  | "mobile"
  | "countryCode"
  | "customCountryCode"
  | "credential"
  | "onNameChange"
  | "onMobileChange"
  | "onCountryCodeChange"
  | "onCustomCountryCodeChange"
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
            Optional. No SMS is sent. Leave this blank to join as a new player
            without a phone number. Your recovery code is needed to reconnect.
          </Note>
          <FormLabel variant="access" htmlFor="phone-country">
            Country calling code
          </FormLabel>
          <InputIcon
            icon="users"
            variant="access"
            iconClassName="icon--size-17"
          >
            <select
              id="phone-country"
              value={countryCode}
              onChange={(event) => onCountryCodeChange(event.target.value)}
            >
              <option value="">Enter full number or local UK number</option>
              <option value="44">United Kingdom (+44)</option>
              <option value="1">US, Canada and others (+1)</option>
              <option value="353">Ireland (+353)</option>
              <option value="61">Australia (+61)</option>
              <option value="64">New Zealand (+64)</option>
              <option value="33">France (+33)</option>
              <option value="49">Germany (+49)</option>
              <option value="91">India (+91)</option>
              <option value="other">Other calling code</option>
            </select>
          </InputIcon>
          {countryCode === "other" && (
            <>
              <FormLabel variant="access" htmlFor="phone-country-custom">
                Calling code digits
              </FormLabel>
              <InputIcon
                icon="users"
                variant="access"
                iconClassName="icon--size-17"
              >
                <input
                  id="phone-country-custom"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-country-code"
                  maxLength={3}
                  placeholder="For example 27"
                  value={customCountryCode}
                  onChange={(event) =>
                    onCustomCountryCodeChange(
                      event.target.value.replace(/\\D/g, "").slice(0, 3),
                    )
                  }
                />
              </InputIcon>
            </>
          )}
          <Note variant="access-help">
            When selecting a calling code, enter the number as dialled from
            abroad. UK numbers may include their leading zero. You can also
            enter a complete number beginning with + or 00.
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
`;export{e as default};