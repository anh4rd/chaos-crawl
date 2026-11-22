import AccessHeader from "../../components/ui/AccessHeader";
import Button from "../../components/ui/Button";
import DisplayHeading from "../../components/ui/DisplayHeading";
import FloatingNotice from "../../components/ui/FloatingNotice";
import FormStack from "../../components/ui/FormStack";
import MascotArt from "../../components/ui/MascotArt";
import Note from "../../components/ui/Note";
import Icon from "../../components/ui/Icon";
import GameCodeInput from "../../components/ui/GameCodeInput";
import JoinProgress from "../../components/ui/JoinProgress";
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
  let titleLead = "Enter your";
  let titleEnd = "details";
  let intro = "Choose how you want to show up in the game.";
  let submitLabel = mode === "join" ? "Join game" : "Rejoin game";
  if (joinStep === 1) {
    titleLead = mode === "join" ? "Join" : "Back for";
    titleEnd = mode === "join" ? "the chaos" : "more chaos";
    intro =
      mode === "join"
        ? "Join a game with the code from your host."
        : "Enter the code and the same mobile number you used when you joined.";
    submitLabel = "Next";
  }
  return (
    <Container className="player-access">
      <AccessHeader
        brand="Chaos"
        hint={mode === "join" ? "JOIN GAME" : "REJOIN GAME"}
      />
      <div
        className={`player-access__content ${joinStep === 1 ? "player-access__content--code" : "player-access__content--details"}`}
      >
        {(mode === "rejoin" || joinStep !== 1) && (
          <JoinProgress step={joinStep} total={3} />
        )}
        {joinStep === 2 && (
          <Button
            type="button"
            variant="access-back"
            fullWidth={false}
            onClick={onBack}
          >
            ← Back
          </Button>
        )}
        {joinStep === 1 && (
          <MascotArt
            src={`${import.meta.env.BASE_URL}chaos-logo.png`}
            alt="Chaos mascot"
          />
        )}
        <DisplayHeading as="h1" variant="access">
          {titleLead}
          <br />
          <span>{titleEnd}</span>
        </DisplayHeading>
        <Note variant="access-intro">{intro}</Note>

        {notice && (
          <FloatingNotice
            tone="notice"
            icon={<Icon name="check-circle2" className="icon--size-17" />}
            message={notice}
          />
        )}
        {error && <FloatingNotice tone="error" role="alert" message={error} />}

        <FormStack onSubmit={onSubmit}>
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
              <div className="form-stack__code">
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
          <Button
            type="submit"
            variant="access"
            disabled={
              joinStep === 1 ? code.replace(/\D/g, "").length !== 6 : !canSubmit
            }
          >
            {busy ? (
              <>
                <Icon
                  name="loader-circle"
                  className="icon--size-19 icon--spinning-session"
                />{" "}
                Joining…
              </>
            ) : (
              <>
                {submitLabel}{" "}
                <Icon name="check-circle2" className="icon--size-18" />
              </>
            )}
          </Button>
        </FormStack>
        {joinStep === 1 && (
          <Button
            type="button"
            variant="access-switch"
            fullWidth={false}
            onClick={onToggleMode}
          >
            {mode === "join"
              ? "Already joined? Rejoin"
              : "New player? Join game"}
          </Button>
        )}
      </div>
    </Container>
  );
}
