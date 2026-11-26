var e=`import FeedbackNotice from "../../components/ui/FeedbackNotice";
import Button from "../../components/ui/Button";
import HostShell from "../../components/host/HostShell";
import type {
  HostShellContent,
  HostPreviewUser,
} from "../../components/host/types";
import { useHostIdentity } from "./useHostIdentity";
export default function HostWorkspace({
  previewUser,
  children,
  ...props
}: HostShellContent & { previewUser?: HostPreviewUser }) {
  const { displayName, homeHref, signOut, createGame, error, dismissError } =
    useHostIdentity(previewUser);
  return (
    <HostShell
      {...props}
      displayName={displayName}
      homeHref={homeHref}
      onSignOut={() => void signOut()}
      onCreate={createGame}
    >
      {error && (
        <FeedbackNotice tone="error" role="alert">
          {error}{" "}
          <Button variant="comic-ghost" onClick={dismissError}>
            Dismiss
          </Button>
        </FeedbackNotice>
      )}
      {children}
    </HostShell>
  );
}
`;export{e as default};