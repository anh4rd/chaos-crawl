import type { JoinResult } from "../../types/playerAccess";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { joinGameSession } from "../../lib/playerAccess";
import type { JoinMode, JoinStep, PlayerAccessModel } from "./types";

function storageKey(code: string) {
  return `chaos-crawl-session-player:${code.replace(/\D/g, "")}`;
}

export function usePlayerAccess({
  codeFromUrl,
  initialMode,
  onJoined,
}: {
  codeFromUrl: string;
  initialMode: JoinMode;
  onJoined: (result: JoinResult) => void;
}): PlayerAccessModel {
  const [mode, setMode] = useState<JoinMode>(initialMode);
  const [code, setCode] = useState(codeFromUrl);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [joinStep, setJoinStep] = useState<JoinStep>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (codeFromUrl) setCode(codeFromUrl);
  }, [codeFromUrl]);

  const canSubmit = useMemo(
    () =>
      code.replace(/\D/g, "").length === 6 &&
      mobile.trim().length >= 8 &&
      (mode === "rejoin" || name.trim().length > 0) &&
      !busy,
    [code, mobile, mode, name, busy],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (joinStep === 1) {
      if (code.replace(/\D/g, "").length === 6) setJoinStep(2);
      return;
    }
    if (!canSubmit) return;
    setBusy(true);
    try {
      const { data, error: joinError } = await joinGameSession({
        p_join_code: code.replace(/\D/g, ""),
        p_name: mode === "join" ? name.trim() : null,
        p_mobile: mobile.trim(),
      });
      if (joinError) throw joinError;
      const result = data;
      if (!result?.player_token || !result?.join_code) {
        throw new Error(
          "The game didn't return a player session. Try again or ask the host for a new code.",
        );
      }
      localStorage.setItem(storageKey(result.join_code), result.player_token);
      if (result.resumed) setNotice(`Welcome back, ${result.player_name}!`);
      onJoined(result);
    } catch (joinError) {
      console.error("JOIN SESSION ERROR", joinError);
      setError(
        joinError instanceof Error
          ? joinError.message
          : "Couldn't join this game. Check the code and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return {
    mode,
    code,
    name,
    mobile,
    joinStep,
    busy,
    error,
    notice,
    canSubmit,
    onCodeChange: setCode,
    onNameChange: setName,
    onMobileChange: setMobile,
    onBack: () => setJoinStep(1),
    onToggleMode: () => {
      setMode(mode === "join" ? "rejoin" : "join");
      setError("");
    },
    onSubmit: (event) => void submit(event),
  };
}
