import type { JoinResult } from "../../types/playerAccess";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  isPlayerAccessRejection,
  joinGameSession,
  playerAccessErrorMessage,
  readCachedPlayer,
} from "../../lib/playerAccess";
import {
  clearPendingRecovery,
  pendingRecoveryCredential,
} from "./recoveryVault";
import type {
  JoinMode,
  JoinStep,
  PlayerAccessModel,
  RecoveryMethod,
} from "./types";
import { formatJoinPhone, validJoinPhone } from "./phoneNumber";

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
  const [recoveryMethod, setRecoveryMethod] = useState<RecoveryMethod>("phone");
  const [code, setCode] = useState(codeFromUrl);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [customCountryCode, setCustomCountryCode] = useState("");
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
  }, [codeFromUrl, code, mode, recoveryMethod]);

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
        ? recoveryMethod === "credential"
          ? credential.trim().length > 0
          : mobile.trim().length > 0 &&
            validJoinPhone(mobile, countryCode, customCountryCode)
        : name.trim().length > 0 &&
          validJoinPhone(mobile, countryCode, customCountryCode)) &&
      !busy,
    [
      code,
      mobile,
      mode,
      name,
      credential,
      busy,
      countryCode,
      customCountryCode,
      recoveryMethod,
    ],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (joinStep === 1) {
      const cleanCode = code.replace(/\D/g, "");
      if (cleanCode.length !== 6 || request.current.pending) return;
      const token = localStorage.getItem(storageKey(cleanCode));
      if (!token) {
        setJoinStep(2);
        return;
      }
      request.current.pending = true;
      const generation = request.current.generation;
      const isCurrent = () =>
        request.current.mounted && request.current.generation === generation;
      setBusy(true);
      try {
        const result = await readCachedPlayer(cleanCode, token);
        if (!isCurrent()) return;
        if (result.error) {
          if (/your player session expired/i.test(result.error.message)) {
            setMode("rejoin");
            setJoinStep(2);
            setNotice(
              "Your saved session expired. Rejoin using your phone number or recovery code.",
            );
          } else {
            setError("Couldn't check your saved session. Please try again.");
          }
          return;
        }
        onJoined(result.data);
      } catch {
        if (isCurrent()) {
          console.error("Saved player session check failed.");
          setError("Couldn't check your saved session. Please try again.");
        }
      } finally {
        request.current.pending = false;
        if (request.current.mounted) setBusy(false);
      }
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
      const formattedMobile = formatJoinPhone(
        mobile,
        countryCode,
        customCountryCode,
      );
      const parameters =
        mode === "join"
          ? {
              action: "register" as const,
              join_code: cleanCode,
              credential: recoveryCredential,
              name: name.trim(),
              mobile: formattedMobile,
            }
          : recoveryMethod === "phone"
            ? {
                action: "recover_phone" as const,
                join_code: cleanCode,
                mobile: formattedMobile,
              }
            : {
                action: "recover" as const,
                join_code: cleanCode,
                credential: recoveryCredential,
              };
      let { data, error: joinError } = await joinGameSession(parameters);
      if (!isCurrent()) return;
      let recoveredByPhone = false;
      if (
        mode === "join" &&
        formattedMobile &&
        isPlayerAccessRejection(joinError)
      ) {
        ({ data, error: joinError } = await joinGameSession({
          action: "recover_phone",
          join_code: cleanCode,
          mobile: formattedMobile,
        }));
        if (!isCurrent()) return;
        recoveredByPhone = !joinError;
      }
      if (joinError) throw joinError;
      const result = data;
      if (!result?.player_token || !result?.join_code) {
        throw new Error(
          "The game didn't return a player session. Try again or ask the host for a new code.",
        );
      }
      localStorage.setItem(storageKey(result.join_code), result.player_token);
      if (mode === "join" && !recoveredByPhone)
        setSetup({ credential: recoveryCredential, result });
      else {
        if (result.resumed) setNotice(`Welcome back, ${result.player_name}!`);
        onJoined(result);
      }
    } catch (accessError) {
      if (!isCurrent()) return;
      console.error("Player access failed.");
      setError(playerAccessErrorMessage(accessError, mode === "join"));
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
    recoveryMethod,
    code,
    name,
    mobile,
    countryCode,
    customCountryCode,
    credential,
    joinStep,
    busy,
    error,
    notice,
    canSubmit,
    onCodeChange: setCode,
    onNameChange: setName,
    onMobileChange: setMobile,
    onCountryCodeChange: setCountryCode,
    onCustomCountryCodeChange: setCustomCountryCode,
    onCredentialChange: setCredential,
    onBack: () => setJoinStep(1),
    onToggleMode: () => {
      setMode(mode === "join" ? "rejoin" : "join");
      setError("");
    },
    onToggleRecoveryMethod: () => {
      setRecoveryMethod(recoveryMethod === "phone" ? "credential" : "phone");
      setError("");
      setNotice("");
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
