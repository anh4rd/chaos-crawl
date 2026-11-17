import type { Dispatch, SetStateAction } from "react";
import type { GameSession, SessionPlayer, SessionTeam } from "./types";

interface RoundOverrideDialogProps {
  busy: boolean;
  setOverridePrompt: Dispatch<
    SetStateAction<
      | { kind: "start" }
      | { kind: "round"; round: number; forceBreak?: boolean }
      | null
    >
  >;
  overridePrompt:
    { kind: "start" } | { kind: "round"; round: number; forceBreak?: boolean };
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
    <div
      className="cc-host-override-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy)
          setOverridePrompt(null);
      }}
    >
      <section
        className="cc-host-override-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cc-host-override-title"
      >
        <span className="cc-host-override-kicker">HOST CONTROL</span>
        <h2 id="cc-host-override-title">
          {overridePrompt.kind === "start"
            ? "Start before everything is ready?"
            : "Override autoplay?"}
        </h2>
        <p>
          {overridePrompt.kind === "start"
            ? "You can start the game now. Round 1 will be ready for everyone; start its timer when you are ready."
            : overridePrompt.forceBreak
              ? `You are starting a break before Round ${overridePrompt.round}. The challenge timer will pause and players will see the planned resume time.`
              : `You are moving directly to Round ${overridePrompt.round}. Its timer will reset and stay paused until you start it. Later timings will shift to follow your start time.`}
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
            <p className="cc-host-override-blocked">
              Assign every player to a team before starting. This requirement
              cannot be overridden.
            </p>
          )}
        {autoplayEnabled && (
          <p className="cc-host-override-note">
            Autoplay is enabled. Confirming gives you manual control for the
            rest of this game.
          </p>
        )}
        <div className="cc-host-override-actions">
          <button
            type="button"
            disabled={busy}
            onClick={() => setOverridePrompt(null)}
          >
            Go back
          </button>
          <button
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
          </button>
        </div>
      </section>
    </div>
  );
}
