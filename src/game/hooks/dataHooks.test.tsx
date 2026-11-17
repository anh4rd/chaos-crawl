import {
  act,
  cleanup,
  render,
  renderHook,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePlayers } from "./usePlayers";
import { usePubs } from "./usePubs";
import { useChallenges } from "./useChallenges";
import { useSideChallenges } from "./useSideChallenges";
import { useChallengeCompletions } from "./useChallengeCompletions";
import { useMedia } from "./useMedia";
import { useScoreEvents } from "./useScoreEvents";
import { useGameState } from "./useGameState";
import { useVotes } from "./useVotes";

type Response = { data: unknown; error: { message: string } | null };
const mock = vi.hoisted(() => ({
  initializationError: null as Error | null,
  requests: [] as {
    signal: AbortSignal;
    resolve: (value: Response) => void;
    reject: (cause: Error) => void;
  }[],
  channels: [] as {
    name: string;
    change?: (payload: { eventType: string }) => void;
    status?: (status: string) => void;
  }[],
  removeChannel: vi.fn(),
}));
vi.mock("../../lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => {
      if (mock.initializationError) throw mock.initializationError;
      const query = {
        select: () => query,
        eq: () => query,
        order: () => query,
        single: () => query,
        abortSignal: (signal: AbortSignal) => {
          const pending = new Promise<Response>((resolve, reject) => {
            mock.requests.push({ signal, resolve, reject });
          });
          return Object.assign(pending, { single: () => pending });
        },
      };
      return query;
    }),
    channel: vi.fn((name: string) => {
      if (mock.initializationError) throw mock.initializationError;
      const callbacks: (typeof mock.channels)[number] = { name };
      mock.channels.push(callbacks);
      const channel = {
        on: (
          _event: string,
          _filter: unknown,
          change: typeof callbacks.change,
        ) => {
          callbacks.change = change;
          return channel;
        },
        subscribe: (status: typeof callbacks.status) => {
          callbacks.status = status;
          return channel;
        },
      };
      return channel;
    }),
    removeChannel: mock.removeChannel,
  },
}));
beforeEach(() => {
  mock.initializationError = null;
  mock.requests.length = 0;
  mock.channels.length = 0;
});
afterEach(cleanup);

const collections = [
  ["players", usePlayers],
  ["pubs", usePubs],
  ["challenges", useChallenges],
  ["side challenges", useSideChallenges],
  ["completions", useChallengeCompletions],
  ["media", useMedia],
  ["scores", useScoreEvents],
] as const;

describe.each(collections)("%s", (_name, useCollection) => {
  it("exposes loading, preserves snapshots on failed refresh, and retries", async () => {
    const { result } = renderHook(() => useCollection());
    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(true);
    const snapshot = [{ id: "row" }];
    await act(async () =>
      mock.requests[0].resolve({ data: snapshot, error: null }),
    );
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(snapshot);
    let reload!: Promise<void>;
    act(() => {
      reload = result.current.reload();
    });
    expect(result.current.loading).toBe(true);
    await act(async () => {
      mock.requests[1].resolve({ data: null, error: { message: "offline" } });
      await reload;
    });
    expect(result.current.error?.message).toBe("offline");
    expect(result.current.data).toEqual(snapshot);
    act(() => {
      reload = result.current.reload();
    });
    await act(async () => {
      mock.requests[2].resolve({ data: [], error: null });
      await reload;
    });
    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
  });
});

it("distinguishes failed initial game load from a successful nullable state", async () => {
  const { result } = renderHook(useGameState);
  expect(result.current.data).toBeNull();
  await act(async () =>
    mock.requests[0].resolve({
      data: null,
      error: { message: "missing game" },
    }),
  );
  expect(result.current.error?.message).toBe("missing game");
  expect(result.current.loading).toBe(false);
});

it("aborts superseded loads and ignores late responses even when abort is ignored", async () => {
  const { result } = renderHook(usePlayers);
  let reload!: Promise<void>;
  act(() => {
    reload = result.current.reload();
  });
  expect(mock.requests[0].signal.aborted).toBe(true);
  await act(async () => {
    mock.requests[1].resolve({ data: [{ id: "new" }], error: null });
    await reload;
  });
  await act(async () =>
    mock.requests[0].resolve({ data: [{ id: "stale" }], error: null }),
  );
  expect(result.current.data).toEqual([{ id: "new" }]);
});

it("aborts on unmount, removes its channel, and ignores late callbacks", async () => {
  const { result, unmount } = renderHook(usePlayers);
  const reload = result.current.reload;
  unmount();
  expect(mock.requests[0].signal.aborted).toBe(true);
  expect(mock.removeChannel).toHaveBeenCalledOnce();
  await act(async () => {
    mock.channels[0].change?.({ eventType: "INSERT" });
    mock.requests[0].resolve({ data: [{ id: "late" }], error: null });
    await reload();
  });
  expect(mock.requests).toHaveLength(1);
});

it.each([usePlayers, useChallengeCompletions])(
  "refreshes INSERT, UPDATE and DELETE without duplicated optimistic rows",
  async (useCollection) => {
    const { result } = renderHook(() => useCollection());
    await act(async () => mock.requests[0].resolve({ data: [], error: null }));
    for (const [index, eventType, data] of [
      [1, "INSERT", [{ id: "one", name: "first" }]],
      [2, "UPDATE", [{ id: "one", name: "updated" }]],
      [3, "DELETE", []],
    ] as const) {
      act(() => mock.channels[0].change?.({ eventType }));
      await act(async () =>
        mock.requests[index].resolve({ data, error: null }),
      );
      expect(result.current.data).toEqual(data);
    }
  },
);

it("reports rejected requests and subscription failures", async () => {
  const { result } = renderHook(usePubs);
  await act(async () => mock.requests[0].reject(new Error("network failed")));
  expect(result.current.error?.message).toBe("network failed");
  act(() => mock.channels[0].status?.("TIMED_OUT"));
  expect(result.current.error?.message).toContain(
    "Live updates for pubs disconnected",
  );
});

it("uses distinct realtime channels for concurrent consumers", async () => {
  renderHook(usePubs);
  renderHook(usePubs);
  expect(new Set(mock.channels.map((channel) => channel.name)).size).toBe(2);
  await waitFor(() => expect(mock.channels).toHaveLength(2));
});

it("turns synchronous client configuration failures into retryable hook errors", async () => {
  mock.initializationError = new Error("Set VITE_SUPABASE_URL");
  const { result } = renderHook(usePubs);
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error?.message).toBe("Set VITE_SUPABASE_URL");
  expect(result.current.data).toEqual([]);
  mock.initializationError = null;
  let reload!: Promise<void>;
  act(() => {
    reload = result.current.reload();
  });
  await act(async () => {
    mock.requests[0].resolve({ data: [{ id: 1, name: "Pub" }], error: null });
    await reload;
  });
  expect(result.current.error).toBeNull();
});

function VoteCount({ challenge }: { challenge: string }) {
  const votes = useVotes(challenge);
  return (
    <>
      <output aria-label="Vote count">{votes.data.length}</output>
      <span>{votes.loading ? "Loading" : "Ready"}</span>
      <button onClick={() => void votes.reload()}>Refresh votes</button>
    </>
  );
}

it("clears vote counts when challenge identity changes while preserving same-round refreshes", async () => {
  const { rerender } = render(<VoteCount challenge="A" />);
  await act(async () =>
    mock.requests[0].resolve({ data: [{ id: 1 }, { id: 2 }], error: null }),
  );
  expect(screen.getByLabelText("Vote count").textContent).toBe("2");
  fireEvent.click(screen.getByRole("button", { name: "Refresh votes" }));
  expect(screen.getByLabelText("Vote count").textContent).toBe("2");
  expect(screen.getByText("Loading")).toBeDefined();
  rerender(<VoteCount challenge="B" />);
  expect(mock.requests[1].signal.aborted).toBe(true);
  expect(screen.getByLabelText("Vote count").textContent).toBe("0");
  expect(screen.getByText("Loading")).toBeDefined();
  await act(async () =>
    mock.requests[2].resolve({ data: [{ id: 3 }], error: null }),
  );
  expect(screen.getByLabelText("Vote count").textContent).toBe("1");
  await act(async () =>
    mock.requests[1].resolve({ data: [{ id: 1 }, { id: 2 }], error: null }),
  );
  expect(screen.getByLabelText("Vote count").textContent).toBe("1");
  expect(screen.getByText("Ready")).toBeDefined();
});

it("does not retain previous challenge errors or allow an obsolete reload to replace the active query", async () => {
  const { result, rerender } = renderHook(
    ({ challenge }) => useVotes(challenge),
    { initialProps: { challenge: "A" } },
  );
  await act(async () =>
    mock.requests[0].resolve({
      data: null,
      error: { message: "Round A failed" },
    }),
  );
  const oldReload = result.current.reload;
  rerender({ challenge: "B" });
  expect(result.current.data).toEqual([]);
  expect(result.current.error).toBeNull();
  expect(result.current.loading).toBe(true);
  await act(async () => oldReload());
  expect(mock.requests).toHaveLength(2);
  await act(async () => mock.requests[1].resolve({ data: [], error: null }));
  expect(result.current.loading).toBe(false);
});
