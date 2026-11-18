import ChaosMonster from "../../../public/chaos-logo.png";
import Icon from "../../components/ui/Icon";
import GameCodeInput from "../../components/ui/GameCodeInput";
import PlayerDetailsFields from "./PlayerDetailsFields";
import type { PlayerAccessModel } from "./types";

export default function PlayerAccessView({
  as: Container = "main",
  mode,
  code,
  name,
  mobile,
  joinStep,
  busy,
  error,
  notice,
  canSubmit,
  onCodeChange,
  onNameChange,
  onMobileChange,
  onBack,
  onToggleMode,
  onSubmit,
}: PlayerAccessModel & { as?: "main" | "section" }) {
  return (
    <Container className="join-flow">
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
          <button type="button" className="join-back" onClick={onBack}>
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

        <form onSubmit={onSubmit} className="join-form">
          {joinStep === 1 ? (
            <>
              <GameCodeInput
                id="join-code"
                value={code}
                onChange={onCodeChange}
              />
            </>
          ) : (
            <>
              <div className="join-current-code">
                GAME CODE <strong>{code}</strong>
              </div>
              <PlayerDetailsFields
                mode={mode}
                name={name}
                mobile={mobile}
                onNameChange={onNameChange}
                onMobileChange={onMobileChange}
              />
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
            onClick={onToggleMode}
          >
            {mode === "join"
              ? "Already joined? Rejoin"
              : "New player? Join game"}
          </button>
        )}
      </div>
    </Container>
  );
}
