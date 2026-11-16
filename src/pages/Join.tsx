import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { createPlayer } from "../lib/playerApi";
import { apiError } from "../lib/apiResult";
import { setPlayerId } from "../lib/playerSession";

export default function Join() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  const createdPlayerId = useRef<string | null>(null);

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Enter your name first.");
      return;
    }
    pending.current = true;
    setJoining(true);
    setError(null);
    try {
      if (!createdPlayerId.current) {
        const result = await createPlayer(cleanName, null);
        if (result.error) throw result.error;
        if (!result.data)
          throw new Error(
            "Your player could not be created. Please try again.",
          );
        createdPlayerId.current = result.data.id;
      }
      // Retain the created ID if browser storage fails so retrying does not
      // create another player after a successful server response.
      const playerId = createdPlayerId.current;
      if (!playerId) throw new Error("Your player session could not be saved.");
      setPlayerId(playerId);
      navigate("/game");
    } catch (cause) {
      setError(apiError(cause).message);
    } finally {
      pending.current = false;
      setJoining(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-md space-y-6 p-6">
      <header>
        <img
          src={`${import.meta.env.BASE_URL}Title.png`}
          alt="Anna's Chaos Crawl"
          className="mx-auto mb-4 w-full"
        />
      </header>
      <Card>
        <h1 className="mb-4 text-3xl font-bold">Join the Chaos</h1>
        <form onSubmit={handleJoin} aria-busy={joining} noValidate>
          <label htmlFor="player-name" className="mb-2 block font-bold">
            Your name
          </label>
          <Input
            id="player-name"
            name="name"
            autoComplete="name"
            placeholder="Your name..."
            value={name}
            disabled={joining || Boolean(createdPlayerId.current)}
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "join-error" : undefined}
            onChange={(event) => setName(event.target.value)}
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
    </main>
  );
}
