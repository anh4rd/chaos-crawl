import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { reportError } from "../../lib/monitoring";
import type { Database } from "../../types/database";

type TableName = keyof Database["public"]["Tables"];
type QueryResponse<T> = { data: T | null; error: { message: string } | null };
export interface QueryState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

/** A snapshot belongs to a semantic query key. Refreshes retain that snapshot;
 * a changed key exposes initial data immediately, even before effects run.
 * Load functions and initial values must be stable across ordinary renders.
 */
export function useRealtimeQuery<T>(
  table: TableName,
  load: (signal: AbortSignal) => PromiseLike<QueryResponse<T>>,
  initialData: T,
  queryKey: string = table,
): QueryState<T> {
  const [snapshot, setSnapshot] = useState({
    key: queryKey,
    data: initialData,
    loading: true,
    error: null as Error | null,
  });
  const active = useRef(false);
  const activeLoad = useRef(load);
  const activeKey = useRef(queryKey);
  const request = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const update = useCallback(
    (patch: Partial<Omit<typeof snapshot, "key">>) => {
      setSnapshot((current) => ({
        ...(current.key === queryKey
          ? current
          : { key: queryKey, data: initialData, loading: true, error: null }),
        ...patch,
      }));
    },
    [queryKey, initialData],
  );
  const cancelPendingRequest = useCallback(() => {
    ++request.current;
    controller.current?.abort();
  }, []);

  const reload = useCallback(async () => {
    if (
      !active.current ||
      activeKey.current !== queryKey ||
      activeLoad.current !== load
    )
      return;
    cancelPendingRequest();
    const version = request.current;
    const nextController = new AbortController();
    controller.current = nextController;
    update({ loading: true, error: null });
    try {
      const result = await load(nextController.signal);
      if (!active.current || version !== request.current) return;
      if (result.error) throw new Error(result.error.message);
      update({ data: result.data ?? initialData });
    } catch (cause) {
      if (!active.current || version !== request.current) return;
      reportError(cause, `query:${table}`);
      update({
        error: cause instanceof Error ? cause : new Error(String(cause)),
      });
    } finally {
      if (active.current && version === request.current)
        update({ loading: false });
    }
  }, [load, initialData, queryKey, table, update, cancelPendingRequest]);

  useEffect(() => {
    active.current = true;
    activeKey.current = queryKey;
    activeLoad.current = load;
    let disposed = false;
    void reload();
    let channel: ReturnType<typeof supabase.channel> | undefined;
    try {
      channel = supabase
        .channel(`${table}-${crypto.randomUUID()}`)
        .on("postgres_changes", { event: "*", schema: "public", table }, () => {
          if (!disposed && active.current) void reload();
        })
        .subscribe((status) => {
          if (
            !disposed &&
            active.current &&
            (status === "CHANNEL_ERROR" || status === "TIMED_OUT")
          ) {
            reportError(new Error(`Realtime ${status}`), `realtime:${table}`);
            update({
              error: new Error(
                `Live updates for ${table} disconnected. Retry to refresh the data.`,
              ),
            });
          }
        });
    } catch (cause) {
      reportError(cause, `realtime:${table}`);
      update({
        error: cause instanceof Error ? cause : new Error(String(cause)),
      });
    }
    return () => {
      disposed = true;
      active.current = false;
      cancelPendingRequest();
      if (channel) void supabase.removeChannel(channel);
    };
  }, [table, queryKey, load, reload, update, cancelPendingRequest]);

  const visible =
    snapshot.key === queryKey
      ? snapshot
      : { data: initialData, loading: true, error: null };
  return {
    data: visible.data,
    loading: visible.loading,
    error: visible.error,
    reload,
  };
}
