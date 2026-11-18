import { useState } from "react";
import HostAccessForm from "../host-access/HostAccessForm";
import type { AuthMode } from "../host-access/types";
import { Example } from "./Example";
import HostPatternPreview from "./HostPatternPreview";

export default function HostAccessExample() {
  const [mode, changeMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  return (
    <section id="host-account-demo" aria-label="Local host account">
      <Example
        title="Local host account tabs"
        source="src/features/host-access/HostAccessForm.tsx"
        code={"<HostAccessForm auth={localStateAndCallbacks} />"}
      >
        <HostPatternPreview>
          <HostAccessForm
            auth={{
              mode,
              changeMode,
              name,
              email,
              password,
              busy: false,
              error: "",
              notice,
              setName,
              setEmail,
              setPassword,
              submit: async (event) => {
                event.preventDefault();
                setNotice(
                  "Account action completed locally. No account was created.",
                );
              },
            }}
          />
        </HostPatternPreview>
      </Example>
    </section>
  );
}
