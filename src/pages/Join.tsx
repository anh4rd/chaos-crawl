import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, Gamepad2, LoaderCircle, RotateCcw, Users } from "lucide-react";
import { supabase } from "../lib/supabase";
import "../styles/SessionGame.css";

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
  const codeFromUrl = (searchParams.get("code") ?? "").replace(/\D/g, "").slice(0, 6);
  const [mode, setMode] = useState<JoinMode>(searchParams.get("returning") === "1" ? "rejoin" : "join");
  const [code, setCode] = useState(codeFromUrl);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (codeFromUrl) setCode(codeFromUrl);
  }, [codeFromUrl]);

  const canSubmit = useMemo(() =>
    code.replace(/\D/g, "").length === 6 &&
    mobile.trim().length >= 8 &&
    (mode === "rejoin" || name.trim().length > 0) &&
    !busy,
  [code, mobile, mode, name, busy]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!canSubmit) return;
    setBusy(true);
    try {
      const { data, error: joinError } = await supabase.rpc("cc_join_game_session", {
        p_join_code: code.replace(/\D/g, ""),
        p_name: mode === "join" ? name.trim() : null,
        p_mobile: mobile.trim(),
      });
      if (joinError) throw joinError;
      const result = data as JoinResult;
      if (!result?.player_token || !result?.join_code) {
        throw new Error("The game didn't return a player session. Try again or ask the host for a new code.");
      }
      localStorage.setItem(storageKey(result.join_code), result.player_token);
      if (result.resumed) setNotice(`Welcome back, ${result.player_name}!`);
      navigate(`/play/${result.join_code}`, { replace: true, state: { welcomeBack: result.resumed } });
    } catch (joinError) {
      console.error("JOIN SESSION ERROR", joinError);
      setError(joinError instanceof Error ? joinError.message : "Couldn't join this game. Check the code and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="cc-player-auth">
      <div className="cc-player-auth-glow" aria-hidden="true" />
      <header className="cc-player-brand">
        <span className="cc-player-brand-icon"><Gamepad2 size={22}/></span>
        <span>CHAOS<span>CRAWL</span></span>
      </header>

      <section className="cc-player-auth-card">
        <div className="cc-player-mascot" aria-hidden="true">✦</div>
        <span className="cc-player-eyebrow">YOUR NEXT QUESTIONABLE DECISION</span>
        <h1>{mode === "join" ? "Join the chaos." : "Back for more?"}</h1>
        <p className="cc-player-intro">
          {mode === "join"
            ? "Enter the game code from your host, pick your name and get ready."
            : "Enter the code and the same mobile number you used when you joined."}
        </p>

        <div className="cc-join-mode-switch" role="tablist" aria-label="Join or rejoin">
          <button type="button" role="tab" aria-selected={mode === "join"} className={mode === "join" ? "is-active" : ""} onClick={() => { setMode("join"); setError(""); }}>
            <Users size={16}/> Join game
          </button>
          <button type="button" role="tab" aria-selected={mode === "rejoin"} className={mode === "rejoin" ? "is-active" : ""} onClick={() => { setMode("rejoin"); setError(""); }}>
            <RotateCcw size={16}/> Rejoin
          </button>
        </div>

        {notice && <div className="cc-player-notice"><CheckCircle2 size={17}/>{notice}</div>}
        {error && <div className="cc-player-error" role="alert">{error}</div>}

        <form onSubmit={(event) => void submit(event)} className="cc-player-form">
          <label className="cc-player-form-join-code-boxes" htmlFor=".cc-player-form-join-code">
            <span>Six-digit game code</span>
            <div className="cc-player-form-join-code-boxes">
                {Array.from({ length: 6 }, (_, index) => <span className={`cc-player-form-join-code-box ${code[index] ? "cc-player-form-join-code-box--filled" : ""}`} key={index}>{code[index] ?? ""}</span>)}
                <input
                  id="join-code"
                  className="cc-player-form-join-code-input-overlay"
                  value={code}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  aria-label="Enter six digit game code"
                  onChange={(event) => { setCode(event.target.value.replace(/\D/g, "").slice(0, 6)); }}
                />
              </div>
          </label>
          {mode === "join" && (
            <label>
              <span>Your name</span>
              <input autoComplete="given-name" placeholder="What should we call you?" maxLength={60} value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
          )}
          <label>
            <span>Mobile number</span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="07xxx xxxxxx"
              value={mobile}
              onChange={(event) => setMobile(event.target.value)}
              required
            />
            <small>Used only to reconnect you to this game if you lose access to your browser. No SMS is sent.</small>
          </label>
          <button type="submit" className="cc-player-primary-button" disabled={!canSubmit}>
            {busy ? <><LoaderCircle className="cc-spin" size={19}/> {mode === "join" ? "Joining…" : "Rejoining…"}</> : <>{mode === "join" ? "Join game" : "Get me back in"} <ArrowRight size={19}/></>}
          </button>
        </form>
      </section>
      <p className="cc-player-auth-footer">One venue. A questionable number of challenges.</p>
    </main>
  );
}
