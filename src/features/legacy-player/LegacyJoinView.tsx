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
        <img
          src={`${import.meta.env.BASE_URL}Title.png`}
          alt="Anna's Chaos Crawl"
          className="mx-auto mb-4 w-full"
        />
      </header>
      <Card>
        <h1 className="mb-4 text-3xl font-bold">Join the Chaos</h1>
        <form onSubmit={onSubmit} aria-busy={joining} noValidate>
          <label htmlFor="player-name" className="mb-2 block font-bold">
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
            <p id="join-error" role="alert" className="mt-3">
              {error}
            </p>
          )}
          <div className="mt-4">
            <Button type="submit" disabled={joining}>
              {joining ? "Joining..." : error ? "Try again" : "Join Game"}
            </Button>
          </div>
        </form>
      </Card>
    </PageFrame>
  );
}
