import type { JoinResult } from "../../types/playerAccess";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { joinGameSession } from "../../lib/playerAccess";
import {
  clearPendingRecovery,
  pendingRecoveryCredential,
} from "./recoveryVault";
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
}): {
  access: PlayerAccessModel;
  setup: { credential: string; onContinue: () => void } | null;
} {
  const [mode, setMode] = useState<JoinMode>(initialMode);
  const [code, setCode] = useState(codeFromUrl);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [credential, setCredential] = useState("");
  const [setup, setSetup] = useState<{
    credential: string;
    result: JoinResult;
  } | null>(null);
  const [joinStep, setJoinStep] = useState<JoinStep>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const request = useRef({ mounted: false, generation: 0, pending: false });

  useLayoutEffect(() => {
    const lifecycle = request.current;
    lifecycle.mounted = true;
    return () => {
      lifecycle.mounted = false;
      lifecycle.generation += 1;
    };
  }, [codeFromUrl, code, mode]);

  useEffect(() => {
    if (codeFromUrl) setCode(codeFromUrl);
  }, [codeFromUrl]);

  useLayoutEffect(() => {
    setSetup(null);
  }, [codeFromUrl, code, mode]);

  const canSubmit = useMemo(
    () =>
      code.replace(/\D/g, "").length === 6 &&
      (mode === "rejoin"
        ? credential.trim().length > 0
        : mobile.trim().length >= 8 && name.trim().length > 0) &&
      !busy,
    [code, mobile, mode, name, credential, busy],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (joinStep === 1) {
      if (code.replace(/\D/g, "").length === 6) setJoinStep(2);
      return;
    }
    if (!canSubmit || request.current.pending) return;
    request.current.pending = true;
    const generation = request.current.generation;
    const isCurrent = () =>
      request.current.mounted && request.current.generation === generation;
    setBusy(true);
    try {
      const cleanCode = code.replace(/\D/g, "");
      const recoveryCredential =
        mode === "join"
          ? await pendingRecoveryCredential(cleanCode)
          : credential.trim();
      if (!isCurrent()) return;
      const { data, error: joinError } = await joinGameSession({
        action: mode === "join" ? "register" : "recover",
        join_code: cleanCode,
        credential: recoveryCredential,
        ...(mode === "join"
          ? { name: name.trim(), mobile: mobile.trim() }
          : {}),
      });
      if (!isCurrent()) return;
      if (joinError) throw joinError;
      const result = data;
      if (!result?.player_token || !result?.join_code) {
        throw new Error(
          "The game didn't return a player session. Try again or ask the host for a new code.",
        );
      }
      localStorage.setItem(storageKey(result.join_code), result.player_token);
      if (mode === "join") setSetup({ credential: recoveryCredential, result });
      else {
        if (result.resumed) setNotice(`Welcome back, ${result.player_name}!`);
        onJoined(result);
      }
    } catch {
      if (!isCurrent()) return;
      console.error("Player access failed.");
      setError(
        "Couldn't complete player access. Check your details and try again.",
      );
    } finally {
      request.current.pending = false;
      if (request.current.mounted) setBusy(false);
    }
  }

  async function completeSetup() {
    if (!setup || request.current.pending) return;
    request.current.pending = true;
    const generation = request.current.generation;
    try {
      await clearPendingRecovery(setup.result.join_code);
      if (request.current.mounted && request.current.generation === generation)
        onJoined(setup.result);
    } catch {
      if (request.current.mounted && request.current.generation === generation)
        setError(
          "Your recovery code could not be cleared from temporary storage. Try again.",
        );
    } finally {
      request.current.pending = false;
    }
  }

  const access: PlayerAccessModel = {
    mode,
    code,
    name,
    mobile,
    credential,
    joinStep,
    busy,
    error,
    notice,
    canSubmit,
    onCodeChange: setCode,
    onNameChange: setName,
    onMobileChange: setMobile,
    onCredentialChange: setCredential,
    onBack: () => setJoinStep(1),
    onToggleMode: () => {
      setMode(mode === "join" ? "rejoin" : "join");
      setError("");
    },
    onSubmit: (event) => void submit(event),
  };
  return {
    access,
    setup: setup
      ? { credential: setup.credential, onContinue: () => void completeSetup() }
      : null,
  };
}
