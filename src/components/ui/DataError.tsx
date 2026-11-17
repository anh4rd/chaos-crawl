import Button from "./Button";

export default function DataError({
  error,
  retry,
  as: Container = "main",
}: {
  error: Error;
  retry: () => Promise<void>;
  as?: "main" | "div";
}) {
  return (
    <Container className="mx-auto max-w-md space-y-4 p-6">
      <p role="alert">{error.message}</p>
      <Button
        type="button"
        onClick={() => {
          void retry();
        }}
      >
        Try again
      </Button>
    </Container>
  );
}
