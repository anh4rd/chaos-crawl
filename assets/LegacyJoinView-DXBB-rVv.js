var e=`import BrandArtwork from "../../components/ui/BrandArtwork";
import type { FormEventHandler } from "react";
import PageFrame from "../../components/ui/PageFrame";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

export default function LegacyJoinView({
  contentAs = "main",
  name,
  joining,
  error,
  locked,
  onNameChange,
  onSubmit,
}: {
  contentAs?: "main" | "div";
  name: string;
  joining: boolean;
  error: string | null;
  locked: boolean;
  onNameChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  return (
    <PageFrame as={contentAs}>
      <header>
        <BrandArtwork />
      </header>
      <Card className="join-form">
        <h1 className="join-form__title">Join the Chaos</h1>
        <form onSubmit={onSubmit} aria-busy={joining} noValidate>
          <label htmlFor="player-name" className="join-form__label">
            Your name
          </label>
          <Input
            id="player-name"
            name="name"
            autoComplete="name"
            placeholder="Your name..."
            value={name}
            disabled={locked}
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "join-error" : undefined}
            onChange={(event) => onNameChange(event.target.value)}
          />
          {error && (
            <p id="join-error" role="alert" className="join-form__feedback">
              {error}
            </p>
          )}
          <div className="join-form__actions">
            <Button type="submit" disabled={joining}>
              {joining ? "Joining..." : error ? "Try again" : "Join Game"}
            </Button>
          </div>
        </form>
      </Card>
    </PageFrame>
  );
}
`;export{e as default};