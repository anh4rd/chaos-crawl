var e=`import { useId, type FormEvent } from "react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Dialog from "../../components/ui/Dialog";
import DialogActions from "../../components/ui/DialogActions";
import DialogNotice from "../../components/ui/DialogNotice";
import DialogPanel from "../../components/ui/DialogPanel";
import FormLabel from "../../components/ui/FormLabel";
import type { GameCohost } from "../../types/hostHub";

export default function CohostDialog({
  gameName,
  email,
  cohosts,
  loading,
  busy,
  error,
  canRetry,
  onEmailChange,
  onAdd,
  onRemove,
  onClose,
  onDismissError,
  onRetry,
}: {
  gameName: string;
  email: string;
  cohosts: GameCohost[];
  loading: boolean;
  busy: boolean;
  error: string;
  canRetry: boolean;
  onEmailChange: (email: string) => void;
  onAdd: (event: FormEvent<HTMLFormElement>) => void;
  onRemove?: (userId: string) => void;
  onClose: () => void;
  onDismissError: () => void;
  onRetry: () => void;
}) {
  const titleId = useId();
  return (
    <Dialog
      variant="host"
      label="Manage co-hosts"
      labelledBy={titleId}
      dismissDisabled={busy}
      onClose={onClose}
    >
      <DialogPanel as="form" onSubmit={onAdd}>
        <Badge variant="dialog">CO-HOSTS</Badge>
        <h2 id={titleId}>Manage co-hosts for {gameName}</h2>
        <p>
          Add an existing host with a verified account. They will see this game
          in their Host Hub. No invitation email is sent.
        </p>
        <FormLabel spaced>
          Host email
          <input
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            disabled={busy}
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
          />
        </FormLabel>
        {loading ? (
          <p>Loading co-hosts…</p>
        ) : cohosts.length ? (
          <ul>
            {cohosts.map((cohost) => (
              <li key={cohost.user_id}>
                {cohost.email}{" "}
                {onRemove && (
                  <Button
                    type="button"
                    variant="dialog"
                    fullWidth={false}
                    disabled={busy}
                    aria-label={\`Remove \${cohost.email}\`}
                    onClick={() => onRemove(cohost.user_id)}
                  >
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No co-hosts have been added.</p>
        )}
        {error && (
          <DialogNotice kind="error" onDismiss={onDismissError}>
            {error}
          </DialogNotice>
        )}
        {canRetry && (
          <Button
            type="button"
            variant="dialog"
            fullWidth={false}
            disabled={busy}
            onClick={onRetry}
          >
            Retry loading co-hosts
          </Button>
        )}
        <DialogActions>
          <Button
            type="button"
            variant="dialog"
            fullWidth={false}
            disabled={busy}
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            type="submit"
            variant="dialog-primary"
            fullWidth={false}
            disabled={busy}
          >
            {busy ? "Saving…" : "Add co-host"}
          </Button>
        </DialogActions>
      </DialogPanel>
    </Dialog>
  );
}
`;export{e as default};