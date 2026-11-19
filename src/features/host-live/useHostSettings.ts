import type { Dispatch, SetStateAction } from "react";
import type { HostSessionSettings } from "../../types/hostSession";
import * as hostSessionCommands from "../../lib/hostSessionCommands";
import type { GameSession } from "./types";
import type { SetHostBusy } from "./useHostOperation";

interface Options {
  session: GameSession | null;
  setBusy: SetHostBusy;
  setError: Dispatch<SetStateAction<string>>;
  setNotice: Dispatch<SetStateAction<string>>;
  setSession: Dispatch<SetStateAction<GameSession | null>>;
  load: () => Promise<void>;
}

export function useHostSettings({
  session,
  setBusy,
  setError,
  setNotice,
  setSession,
  load,
}: Options) {
  async function saveSettings(values: HostSessionSettings) {
    if (!session || session.status === "completed") return;
    if (!setBusy(true)) return;
    setError("");
    setNotice("");
    const { error: updateError } =
      await hostSessionCommands.updateHostSessionSettings({
        values,
        sessionId: session.id,
      });
    setBusy(false);
    if (updateError) {
      setError(`Couldn't update session settings: ${updateError.message}`);
      return;
    }
    setSession((current) =>
      current?.id === session.id ? { ...current, ...values } : current,
    );
    setNotice("Session settings updated.");
    await load();
  }

  return { saveSettings };
}
