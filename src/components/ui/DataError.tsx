import Button from "./Button";

export default function DataError({
  error,
  retry,
}: {
  error: Error;
  retry: () => Promise<void>;
}) {
  return (
    <main className="mx-auto max-w-md space-y-4 p-6">
      <p role="alert">{error.message}</p>
      <Button
        type="button"
        onClick={() => {
          void retry();
        }}
      >
        Try again
      </Button>
    </main>
  );
}
