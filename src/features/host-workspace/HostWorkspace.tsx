import HostShell from "../../components/host/HostShell";
import type {
  HostShellContent,
  HostPreviewUser,
} from "../../components/host/types";
import { useHostIdentity } from "./useHostIdentity";
export default function HostWorkspace({
  previewUser,
  ...props
}: HostShellContent & { previewUser?: HostPreviewUser }) {
  const { displayName, homeHref, signOut, createGame } =
    useHostIdentity(previewUser);
  return (
    <HostShell
      {...props}
      displayName={displayName}
      homeHref={homeHref}
      onSignOut={() => void signOut()}
      onCreate={createGame}
    />
  );
}
