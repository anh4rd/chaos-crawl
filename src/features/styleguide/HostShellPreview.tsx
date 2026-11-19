import { useState } from "react";
import HostShell from "../../components/host/HostShell";
import LoadingScreen from "../../components/ui/LoadingScreen";
import Note from "../../components/ui/Note";
import Button from "../../components/ui/Button";
import { Example } from "./Example";
export default function HostShellPreview() {
  const [notice, setNotice] = useState("");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  return (
    <>
      <Example
        title="HostShell + host navigation"
        source="src/components/host/HostShell.tsx"
        code={
          '<HostShell displayName="Alex" homeHref="/host"\n  onSignOut={onSignOut} onCreate={onCreate}\n  title="Your workspace">\n  <p>Page content</p>\n</HostShell>'
        }
      >
        <Button
          type="button"
          variant="text"
          fullWidth={false}
          onClick={() => setReadOnly((value) => !value)}
        >
          {readOnly ? "Show interactive preview" : "Show read-only preview"}
        </Button>
        <Button
          type="button"
          variant="text"
          fullWidth={false}
          onClick={() => setSidebarVisible((value) => !value)}
        >
          {sidebarVisible ? "Hide sidebar preview" : "Show sidebar preview"}
        </Button>
        <div className="host-shell-preview">
          <HostShell
            sidebar={
              sidebarVisible ? (
                <p>Sidebar content supplied by the route.</p>
              ) : undefined
            }
            contentAs="div"
            readOnlyPreview={readOnly}
            showCreate={!readOnly}
            displayName="Alex"
            homeHref="/host"
            onSignOut={() => setNotice("Sign out selected locally.")}
            onCreate={() => setNotice("Create game selected locally.")}
            onNavigate={(href) =>
              setNotice(`Navigation selected locally: ${href}`)
            }
            title="Your workspace"
            subtitle="A local shell preview."
          >
            <p>Page content belongs to the route.</p>
          </HostShell>
        </div>
        <Note as="output">
          {notice ||
            "Identity and callbacks are local; the shell reads no backend."}
        </Note>
      </Example>
      <Example
        title="LoadingScreen + Spinner"
        source="src/components/ui/LoadingScreen.tsx"
        code={
          '<LoadingScreen>Checking your session…</LoadingScreen>\n// Use as="div" inside another main landmark.'
        }
      >
        <div className="host-portal">
          <LoadingScreen as="div">Checking your session…</LoadingScreen>
        </div>
      </Example>
    </>
  );
}
