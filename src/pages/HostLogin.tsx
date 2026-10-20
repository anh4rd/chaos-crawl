import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";
import "../styles/HostPortal.css";

type AuthMode = "login" | "signup";

export default function HostLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let alive = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (alive && data.session) navigate("/host", { replace: true });
    });
    return () => { alive = false; };
  }, [navigate]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { display_name: name.trim() } },
      });

      setBusy(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (data.session) {
        navigate("/host", { replace: true });
      } else {
        setNotice("Account created. Check your email to confirm your address, then come back here to log in.");
      }
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setBusy(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    navigate("/host", { replace: true });
  }

  return (
    <main className="host-portal host-auth-page">
      <div className="host-auth-shell">
        <Link to="/" className="host-brand" aria-label="Chaos Crawl home">
          <span className="host-brand-mark"><Sparkles size={22} /></span>
          <span>CHAOS<span className="host-brand-accent">CRAWL</span></span>
        </Link>

        <section className="host-auth-card">
          <div className="host-eyebrow">HOST HUB</div>
          <h1>{mode === "login" ? "Welcome back." : "Make some chaos."}</h1>
          <p className="host-muted">
            {mode === "login"
              ? "Log in to manage your games, save favourite tasks and plan your next event."
              : "Create a host account to save game plans and build your own ridiculous party."}
          </p>

          <div className="host-auth-switch" role="tablist" aria-label="Account action">
            <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "is-active" : ""} onClick={() => { setMode("login"); setError(""); setNotice(""); }}>
              Log in
            </button>
            <button type="button" role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "is-active" : ""} onClick={() => { setMode("signup"); setError(""); setNotice(""); }}>
              Create account
            </button>
          </div>

          <form className="host-form" onSubmit={submit}>
            {mode === "signup" && (
              <label className="host-field">
                <span>Your name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required placeholder="What should we call you?" />
              </label>
            )}
            <label className="host-field">
              <span>Email address</span>
              <div className="host-input-icon">
                <Mail size={18} aria-hidden="true" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required placeholder="you@example.com" />
              </div>
            </label>
            <label className="host-field">
              <span>Password</span>
              <div className="host-input-icon">
                <LockKeyhole size={18} aria-hidden="true" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} placeholder="At least 8 characters" />
              </div>
              {mode === "signup" && <small>Use at least 8 characters.</small>}
            </label>

            {error && <div className="host-alert host-alert--error" role="alert">{error}</div>}
            {notice && <div className="host-alert host-alert--success" role="status">{notice}</div>}

            <button className="host-button host-button--primary host-button--full" type="submit" disabled={busy}>
              {busy ? "One sec…" : mode === "login" ? "Log in to Host Hub" : "Create host account"}
              {!busy && <ArrowRight size={18} />}
            </button>
          </form>
          <p className="host-auth-footnote">Player joining stays separate. This account is for the person hosting and managing the game.</p>
        </section>
        <p className="host-auth-footer">Big ideas. Questionable decisions. Excellent stories.</p>
      </div>
    </main>
  );
}
