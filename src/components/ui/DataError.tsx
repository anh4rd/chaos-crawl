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
    <Container className="data-error">
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
