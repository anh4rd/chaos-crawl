import { useRef, useState, type FormEvent } from "react";
import { createPlayer } from "../../lib/playerApi";
import { apiError } from "../../lib/apiResult";
import { setPlayerId } from "../../lib/playerSession";

export function useLegacyJoin(onJoined: () => void) {
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
      onJoined();
    } catch (cause) {
      setError(apiError(cause).message);
    } finally {
      pending.current = false;
      setJoining(false);
    }
  }

  return {
    name,
    joining,
    error,
    locked: joining || Boolean(createdPlayerId.current),
    onNameChange: setName,
    onSubmit: handleJoin,
  };
}
