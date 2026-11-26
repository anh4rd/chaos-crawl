import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { failedResult } from "../../lib/apiResult";
import { addGameCohost, removeGameCohost } from "../../lib/hostCohostCommands";
import { readGameCohosts } from "../../lib/hostHubQueries";
import type { GameCohost, HostGame } from "../../types/hostHub";
import CohostDialog from "./CohostDialog";

export default function GameCohostManager({
  game,
  onClose,
}: {
  game: HostGame;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [cohosts, setCohosts] = useState<GameCohost[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [queryError, setQueryError] = useState("");
  const [queryFailed, setQueryFailed] = useState(false);
  const [actionError, setActionError] = useState("");
  const mounted = useRef(false);
  const request = useRef(0);
  const lock = useRef(false);

  const refresh = useCallback(async () => {
    const generation = ++request.current;
    setLoading(true);
    setQueryError("");
    setQueryFailed(false);
    const { data, error } = await readGameCohosts(game.id).catch(failedResult);
    if (!mounted.current || generation !== request.current) return;
    setLoading(false);
    if (error || !data) {
      setCohosts([]);
      setQueryFailed(true);
      setQueryError(error?.message ?? "Couldn't load the co-host list.");
    } else setCohosts(data);
  }, [game.id]);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    return () => {
      mounted.current = false;
      request.current += 1;
    };
  }, [refresh]);

  async function change(
    operation: () => ReturnType<typeof addGameCohost>,
    clearEmail = false,
  ) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    request.current += 1;
    setLoading(false);
    setActionError("");
    setQueryError("");
    try {
      const { error } = await operation().catch(failedResult);
      if (!mounted.current) return;
      if (error) setActionError(error.message);
      else {
        if (clearEmail) setEmail("");
        await refresh();
      }
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setActionError("Enter the host's email.");
      return;
    }
    void change(() => addGameCohost(game.id, trimmed), true);
  }

  return (
    <CohostDialog
      gameName={game.name}
      email={email}
      cohosts={cohosts}
      loading={loading}
      busy={busy}
      error={actionError || queryError}
      canRetry={queryFailed}
      onEmailChange={setEmail}
      onAdd={add}
      onRemove={(userId) =>
        void change(() => removeGameCohost(game.id, userId))
      }
      onClose={onClose}
      onDismissError={() => {
        setActionError("");
        setQueryError("");
      }}
      onRetry={() => void refresh()}
    />
  );
}
