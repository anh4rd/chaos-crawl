import { Field } from "../../components/ui/Field";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import InputIcon from "../../components/ui/InputIcon";
import type { HostAccessState } from "./types";
export default function HostAccessForm({ auth }: { auth: HostAccessState }) {
  const {
    mode,
    name,
    email,
    password,
    busy,
    error,
    notice,
    setName,
    setEmail,
    setPassword,
    submit,
    changeMode,
  } = auth;
  return (
    <section className="host-access-form">
      <div className="host-eyebrow">HOST HUB</div>
      <h1 className="host-access-form__title">
        {mode === "login" ? "Welcome back." : "Make some chaos."}
      </h1>
      <p className="host-muted host-access-form__description">
        {mode === "login"
          ? "Log in to manage your games, save favourite tasks and plan your next event."
          : "Create a host account to save game plans and build your own ridiculous party."}
      </p>

      <div
        className="host-access-form__modes"
        role="tablist"
        aria-label="Account action"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          className={`host-access-form__mode${mode === "login" ? " host-access-form__mode--selected" : ""}`}
          onClick={() => {
            changeMode("login");
          }}
        >
          Log in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          className={`host-access-form__mode${mode === "signup" ? " host-access-form__mode--selected" : ""}`}
          onClick={() => {
            changeMode("signup");
          }}
        >
          Create account
        </button>
      </div>

      <form className="host-access-form__fields" onSubmit={submit}>
        {mode === "signup" && (
          <Field variant="comic" label="Your name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              placeholder="What should we call you?"
            />
          </Field>
        )}
        <Field variant="comic" label="Email address">
          <InputIcon icon="mail">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
          </InputIcon>
        </Field>
        <Field
          variant="comic"
          label="Password"
          hint={mode === "signup" ? "Use at least 8 characters." : undefined}
        >
          <InputIcon icon="lock-keyhole">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              minLength={8}
              placeholder="At least 8 characters"
            />
          </InputIcon>
        </Field>

        {error && (
          <div className="host-alert host-alert--error" role="alert">
            {error}
          </div>
        )}
        {notice && (
          <div className="host-alert host-alert--success" role="status">
            {notice}
          </div>
        )}

        <Button
          variant="comic-primary"
          fullWidth={true}
          type="submit"
          disabled={busy}
        >
          {busy
            ? "One sec…"
            : mode === "login"
              ? "Log in to Host Hub"
              : "Create host account"}
          {!busy && <Icon name="arrow-right" className="icon--size-18" />}
        </Button>
      </form>
      <p className="host-access-form__footnote">
        Player joining stays separate. This account is for the person hosting
        and managing the game.
      </p>
    </section>
  );
}
