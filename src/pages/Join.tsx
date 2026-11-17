import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ChaosMonster from "../../public/chaos-logo.png";
import Icon from "../components/ui/Icon";
import { supabase } from "../lib/sessionSupabase";
import "../styles/PlayerGame.css";

type JoinMode = "join" | "rejoin";
interface JoinResult {
  session_id: string;
  join_code: string;
  player_id: string;
  player_token: string;
  player_name: string;
  resumed: boolean;
  session_status: "lobby" | "live" | "completed";
}

function storageKey(code: string) {
  return `chaos-crawl-session-player:${code.replace(/\D/g, "")}`;
}

export default function Join() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const codeFromUrl = (searchParams.get("code") ?? "")
    .replace(/\D/g, "")
    .slice(0, 6);
  const [mode, setMode] = useState<JoinMode>(
    searchParams.get("returning") === "1" ? "rejoin" : "join",
  );
  const [code, setCode] = useState(codeFromUrl);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [joinStep, setJoinStep] = useState<1 | 2>(1);
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
      const { data, error: joinError } = await supabase.rpc(
        "cc_join_game_session",
        {
          p_join_code: code.replace(/\D/g, ""),
          p_name: mode === "join" ? name.trim() : null,
          p_mobile: mobile.trim(),
        },
      );
      if (joinError) throw joinError;
      const result = data as JoinResult;
      if (!result?.player_token || !result?.join_code) {
        throw new Error(
          "The game didn't return a player session. Try again or ask the host for a new code.",
        );
      }
      localStorage.setItem(storageKey(result.join_code), result.player_token);
      if (result.resumed) setNotice(`Welcome back, ${result.player_name}!`);
      navigate(`/play/${result.join_code}`, {
        replace: true,
        state: { welcomeBack: result.resumed },
      });
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

  return (
    <main className="join-flow">
      <header className="join-topbar">
        <span className="join-brand">Chaos</span>
        <span className="join-topbar__hint">
          {mode === "join" ? "JOIN GAME" : "REJOIN GAME"}
        </span>
      </header>
      <div
        className={`join-flow__content ${joinStep === 1 ? "join-flow__content--code" : "join-flow__content--details"}`}
      >
        {joinStep === 2 && (
          <button
            type="button"
            className="join-back"
            onClick={() => setJoinStep(1)}
          >
            ← Back
          </button>
        )}
        {joinStep === 1 && (
          <img
            className="join-monster-art"
            src={ChaosMonster}
            alt="Chaos mascot"
          />
        )}
        <h1 className="join-display-title">
          {joinStep === 1 ? (
            mode === "join" ? (
              <>
                Join
                <br />
                <span>the chaos</span>
              </>
            ) : (
              <>
                Back for
                <br />
                <span>more chaos</span>
              </>
            )
          ) : (
            <>
              Enter your
              <br />
              <span>details</span>
            </>
          )}
        </h1>
        <p className="join-intro">
          {joinStep === 2
            ? "Choose how you want to show up in the game."
            : mode === "join"
              ? "Join a game with the code from your host."
              : "Enter the code and the same mobile number you used when you joined."}
        </p>

        {notice && (
          <div className="join-message join-message--notice">
            <Icon name="check-circle2" className="icon--size-17" />
            <span>{notice}</span>
          </div>
        )}
        {error && (
          <div className="join-message join-message--error" role="alert">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={(event) => void submit(event)} className="join-form">
          {joinStep === 1 ? (
            <>
              <label className="join-code-label" htmlFor="join-code">
                Six-digit game code
              </label>
              <div className="join-code-boxes" aria-label="Six digit game code">
                {Array.from({ length: 6 }, (_, index) => (
                  <span
                    className={`join-code-box${code[index] ? " join-code-box--filled" : ""}`}
                    key={index}
                  >
                    {code[index] ?? "1"}
                  </span>
                ))}
                <input
                  id="join-code"
                  className="join-code-input-overlay"
                  value={code}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  aria-label="Enter six digit game code"
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                />
              </div>
            </>
          ) : (
            <>
              <div className="join-current-code">
                GAME CODE <strong>{code}</strong>
              </div>
              {mode === "join" && (
                <div className="join-form-card">
                  <label htmlFor="join-name">Your name?</label>
                  <div className="join-input-wrap">
                    <Icon name="users" className="icon--size-17" />
                    <input
                      id="join-name"
                      autoComplete="given-name"
                      placeholder="Enter your name"
                      maxLength={60}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                    />
                  </div>
                </div>
              )}
              <div className="join-form-card">
                <label htmlFor="join-mobile">Your phone number?</label>
                <p className="join-field-help">
                  Used only to reconnect you to this game. No SMS is sent.
                </p>
                <div className="join-input-wrap">
                  <Icon name="users" className="icon--size-17" />
                  <input
                    id="join-mobile"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="Enter your number"
                    value={mobile}
                    onChange={(event) => setMobile(event.target.value)}
                    required
                  />
                </div>
              </div>
            </>
          )}
          <button
            type="submit"
            className="join-primary-button"
            disabled={
              joinStep === 1 ? code.replace(/\D/g, "").length !== 6 : !canSubmit
            }
          >
            {busy ? (
              <>
                <Icon name="loader-circle" className="icon--size-19 cc-spin" />{" "}
                Joining…
              </>
            ) : (
              <>
                {joinStep === 1
                  ? "Next"
                  : mode === "join"
                    ? "Join game"
                    : "Rejoin game"}{" "}
                <Icon name="check-circle2" className="icon--size-18" />
              </>
            )}
          </button>
        </form>
        {joinStep === 1 && (
          <button
            type="button"
            className="join-text-button"
            onClick={() => {
              setMode(mode === "join" ? "rejoin" : "join");
              setError("");
            }}
          >
            {mode === "join"
              ? "Already joined? Rejoin"
              : "New player? Join game"}
          </button>
        )}
      </div>
    </main>
  );
}
