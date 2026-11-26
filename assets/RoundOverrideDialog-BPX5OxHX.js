var e=`import DialogNotice from "../../components/ui/DialogNotice";
import DialogPanel from "../../components/ui/DialogPanel";
import DialogActions from "../../components/ui/DialogActions";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Dialog from "../../components/ui/Dialog";
import type { Dispatch, SetStateAction } from "react";
import type { GameSession, SessionPlayer, SessionTeam } from "./types";

interface RoundOverrideDialogProps {
  busy: boolean;
  setOverridePrompt: Dispatch<
    SetStateAction<
      | { kind: "start" }
      | { kind: "round"; round: number; forceBreak?: boolean; direct?: boolean }
      | null
    >
  >;
  overridePrompt:
    | { kind: "start" }
    | { kind: "round"; round: number; forceBreak?: boolean; direct?: boolean };
  startOverrideReasons: () => string[];
  players: SessionPlayer[];
  session: GameSession;
  unassignedPlayers: SessionPlayer[];
  autoplayEnabled: boolean;
  teams: SessionTeam[];
  confirmHostOverride: () => void;
}

export default function RoundOverrideDialog({
  busy,
  setOverridePrompt,
  overridePrompt,
  startOverrideReasons,
  players,
  session,
  unassignedPlayers,
  autoplayEnabled,
  teams,
  confirmHostOverride,
}: RoundOverrideDialogProps) {
  return (
    <Dialog
      variant="host"
      label={
        overridePrompt.kind === "start"
          ? "Start before everything is ready?"
          : "Override autoplay?"
      }
      labelledBy="cc-host-override-title"
      dismissDisabled={busy}
      onClose={() => setOverridePrompt(null)}
      role="alertdialog"
    >
      <DialogPanel>
        <Badge variant="dialog">HOST CONTROL</Badge>
        <h2 id="cc-host-override-title">
          {overridePrompt.kind === "start"
            ? "Start before everything is ready?"
            : "Override autoplay?"}
        </h2>
        <p>
          {overridePrompt.kind === "start"
            ? "You can start the game now. Round 1 will be ready for everyone; start its timer when you are ready."
            : overridePrompt.forceBreak
              ? \`You are starting a break before Round \${overridePrompt.round}. The challenge timer will pause and players will see the planned resume time.\`
              : \`You are moving directly to Round \${overridePrompt.round}. Its timer will reset and stay paused until you start it. Later timings will shift to follow your start time.\`}
        </p>
        {overridePrompt.kind === "start" && (
          <ul>
            {startOverrideReasons().map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        )}
        {overridePrompt.kind === "start" &&
          players.length > 0 &&
          session.teams_enabled &&
          unassignedPlayers.length > 0 && (
            <DialogNotice kind="error">
              Assign every player to a team before starting. This requirement
              cannot be overridden.
            </DialogNotice>
          )}
        {autoplayEnabled && (
          <DialogNotice kind="warning">
            Autoplay is enabled. Confirming gives you manual control for the
            rest of this game.
          </DialogNotice>
        )}
        <DialogActions>
          <Button
            fullWidth={false}
            variant="dialog"
            type="button"
            disabled={busy}
            onClick={() => setOverridePrompt(null)}
          >
            Go back
          </Button>
          <Button
            fullWidth={false}
            variant="dialog-primary"
            type="button"
            disabled={
              busy ||
              (overridePrompt.kind === "start" &&
                (players.length === 0 ||
                  (session.teams_enabled &&
                    (teams.length === 0 || unassignedPlayers.length > 0))))
            }
            onClick={confirmHostOverride}
          >
            {busy
              ? "Working…"
              : overridePrompt.kind === "start" &&
                  players.length > 0 &&
                  session.teams_enabled &&
                  (teams.length === 0 || unassignedPlayers.length > 0)
                ? "Assign teams first"
                : overridePrompt.kind === "start"
                  ? "Override & start game"
                  : overridePrompt.forceBreak
                    ? "Override & start break"
                    : "Override & move round"}
          </Button>
        </DialogActions>
      </DialogPanel>
    </Dialog>
  );
}
`;export{e as default};