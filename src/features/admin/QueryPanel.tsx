import PanelGrid from "../../components/ui/PanelGrid";
import { useEffect, useState, type ReactNode } from "react";
import Button from "../../components/ui/Button";
type QueryStatus = {
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
};
/** Keep a usable snapshot visible during refresh, but never mistake a failed
 * first load for a successful empty collection. */
export default function QueryPanel({
  queries,
  loadingText,
  children,
}: {
  queries: readonly QueryStatus[];
  loadingText: string;
  children: ReactNode;
}) {
  const settled = queries.every((query) => !query.loading && !query.error);
  const [hasLoaded, setHasLoaded] = useState(settled);
  useEffect(() => {
    if (settled) setHasLoaded(true);
  }, [settled]);
  const ready = hasLoaded || settled;
  return (
    <>
      {queries.map(
        ({ error, reload }, index) =>
          error && (
            <PanelGrid key={index} variant="feed-feedback">
              <p role="alert">{error.message}</p>
              <Button
                type="button"
                onClick={() => {
                  void reload();
                }}
              >
                Try again
              </Button>
            </PanelGrid>
          ),
      )}
      {!ready && queries.some((query) => query.loading) && <p>{loadingText}</p>}
      {ready && children}
    </>
  );
}
