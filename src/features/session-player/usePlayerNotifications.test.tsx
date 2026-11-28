import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { usePlayerNotifications } from "./usePlayerNotifications";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("../../lib/sessionSupabase", () => ({ supabase: { rpc } }));

beforeEach(() => {
  rpc.mockReset();
  rpc.mockResolvedValue({ data: [], error: null });
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it("loads and dismisses notifications for the current player", async () => {
  rpc.mockImplementation((name: string) =>
    Promise.resolve({
      data:
        name === "cc_get_player_notifications"
          ? [{ id: "one", body: "A new round has started." }]
          : null,
      error: null,
    }),
  );
  const { result } = renderHook(() =>
    usePlayerNotifications("123456", "token"),
  );
  await waitFor(() => expect(result.current.notifications).toHaveLength(1));
  await act(() => result.current.dismiss("one"));
  expect(result.current.notifications).toEqual([]);
  expect(rpc).toHaveBeenCalledWith("cc_dismiss_player_notification", {
    p_join_code: "123456",
    p_player_token: "token",
    p_notification_id: "one",
  });
});

it("ignores notifications returned after the player changes", async () => {
  let resolveOld: (result: unknown) => void = () => {};
  rpc.mockImplementation((_name: string, args: { p_player_token: string }) =>
    args.p_player_token === "old"
      ? new Promise((resolve) => {
          resolveOld = resolve;
        })
      : Promise.resolve({ data: [{ id: "new", body: "New" }], error: null }),
  );
  const { result, rerender } = renderHook(
    ({ token }) => usePlayerNotifications("123456", token),
    { initialProps: { token: "old" } },
  );
  rerender({ token: "new" });
  await waitFor(() => expect(result.current.notifications[0]?.id).toBe("new"));
  await act(async () =>
    resolveOld({ data: [{ id: "old", body: "Old" }], error: null }),
  );
  expect(result.current.notifications[0]?.id).toBe("new");
});

it("does not render a previous player's notices during an identity change", async () => {
  const renders: Array<{ token: string; notices: string[] }> = [];
  rpc.mockImplementation((_name: string, args: { p_player_token: string }) =>
    args.p_player_token === "old"
      ? Promise.resolve({ data: [{ id: "old", body: "Private" }], error: null })
      : new Promise(() => {}),
  );
  const { result, rerender } = renderHook(
    ({ token }) => {
      const state = usePlayerNotifications("123456", token);
      renders.push({
        token,
        notices: state.notifications.map((notice) => notice.id),
      });
      return state;
    },
    { initialProps: { token: "old" } },
  );
  await waitFor(() => expect(result.current.notifications).toHaveLength(1));
  rerender({ token: "new" });
  expect(renders.find((render) => render.token === "new")?.notices).toEqual([]);
});

it("polls for new notices and keeps dismissed notices gone after remounting", async () => {
  vi.useFakeTimers();
  let notices: Array<{ id: string; body: string }> = [];
  rpc.mockImplementation((name: string) => {
    if (name === "cc_get_player_notifications")
      return Promise.resolve({ data: [...notices], error: null });
    if (name === "cc_dismiss_player_notification") notices = [];
    return Promise.resolve({ data: null, error: null });
  });
  const { result, unmount } = renderHook(() =>
    usePlayerNotifications("123456", "token"),
  );
  await act(async () => {});
  expect(result.current.notifications).toEqual([]);

  notices = [{ id: "one", body: "A new round has started." }];
  await act(async () => vi.advanceTimersByTimeAsync(5000));
  expect(result.current.notifications).toEqual(notices);
  await act(() => result.current.dismiss("one"));
  unmount();

  const remounted = renderHook(() => usePlayerNotifications("123456", "token"));
  await act(async () => {});
  expect(remounted.result.current.notifications).toEqual([]);
});

it("registers an existing browser subscription for the current player", async () => {
  vi.stubEnv("VITE_VAPID_PUBLIC_KEY", "public-key");
  vi.stubGlobal("PushManager", class {});
  const subscription = {
    toJSON: () => ({
      endpoint: "https://fcm.googleapis.com/fcm/send/device",
      keys: { p256dh: "key", auth: "auth" },
    }),
  };
  const original = Object.getOwnPropertyDescriptor(navigator, "serviceWorker");
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: {
      ready: Promise.resolve({
        pushManager: { getSubscription: () => Promise.resolve(subscription) },
      }),
    },
  });

  try {
    const { result } = renderHook(() =>
      usePlayerNotifications("123456", "token"),
    );
    await waitFor(() =>
      expect(rpc).toHaveBeenCalledWith("cc_register_push_subscription", {
        p_join_code: "123456",
        p_player_token: "token",
        p_endpoint: subscription.toJSON().endpoint,
        p_p256dh: "key",
        p_auth: "auth",
      }),
    );
    await waitFor(() => expect(result.current.canEnablePush).toBe(false));
  } finally {
    if (original) Object.defineProperty(navigator, "serviceWorker", original);
    else Reflect.deleteProperty(navigator, "serviceWorker");
  }
});

it("subscribes only once for overlapping enable actions and registers the device", async () => {
  vi.stubEnv("VITE_VAPID_PUBLIC_KEY", "BA");
  vi.stubGlobal("PushManager", class {});
  const subscription = {
    toJSON: () => ({
      endpoint: "https://fcm.googleapis.com/fcm/send/device",
      keys: { p256dh: "key", auth: "auth" },
    }),
  };
  let resolveSubscribe: (value: typeof subscription) => void = () => {};
  const subscribe = vi.fn(
    () =>
      new Promise<typeof subscription>((resolve) => {
        resolveSubscribe = resolve;
      }),
  );
  const original = Object.getOwnPropertyDescriptor(navigator, "serviceWorker");
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: {
      ready: Promise.resolve({
        pushManager: {
          getSubscription: () => Promise.resolve(null),
          subscribe,
        },
      }),
    },
  });
  try {
    const { result } = renderHook(() =>
      usePlayerNotifications("123456", "token"),
    );
    await waitFor(() => expect(result.current.canEnablePush).toBe(true));
    act(() => {
      result.current.enablePush();
      result.current.enablePush();
    });
    expect(subscribe).toHaveBeenCalledOnce();
    await act(async () => resolveSubscribe(subscription));
    await waitFor(() => expect(result.current.canEnablePush).toBe(false));
    expect(rpc).toHaveBeenCalledWith(
      "cc_register_push_subscription",
      expect.objectContaining({
        p_player_token: "token",
        p_endpoint: subscription.toJSON().endpoint,
      }),
    );
  } finally {
    if (original) Object.defineProperty(navigator, "serviceWorker", original);
    else Reflect.deleteProperty(navigator, "serviceWorker");
  }
});

it("keeps in-game notifications available when push permission is denied and allows a retry", async () => {
  vi.stubEnv("VITE_VAPID_PUBLIC_KEY", "BA");
  vi.stubGlobal("PushManager", class {});
  const subscription = {
    toJSON: () => ({
      endpoint: "https://fcm.googleapis.com/fcm/send/device",
      keys: { p256dh: "key", auth: "auth" },
    }),
  };
  const subscribe = vi
    .fn()
    .mockRejectedValueOnce(
      new DOMException("Permission denied", "NotAllowedError"),
    )
    .mockResolvedValue(subscription);
  rpc.mockImplementation((name: string) =>
    Promise.resolve({
      data:
        name === "cc_get_player_notifications"
          ? [{ id: "one", body: "A new round has started." }]
          : null,
      error: null,
    }),
  );
  const original = Object.getOwnPropertyDescriptor(navigator, "serviceWorker");
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: {
      ready: Promise.resolve({
        pushManager: {
          getSubscription: () => Promise.resolve(null),
          subscribe,
        },
      }),
    },
  });
  try {
    const { result } = renderHook(() =>
      usePlayerNotifications("123456", "token"),
    );
    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.canEnablePush).toBe(true);
    });

    act(() => result.current.enablePush());
    await waitFor(() =>
      expect(result.current.error).toContain(
        "In-game notifications are still available.",
      ),
    );
    expect(result.current.notifications[0]?.id).toBe("one");
    expect(result.current.canEnablePush).toBe(true);
    expect(rpc).not.toHaveBeenCalledWith(
      "cc_register_push_subscription",
      expect.anything(),
    );

    await act(() => result.current.dismiss("one"));
    expect(result.current.notifications).toEqual([]);
    act(() => result.current.enablePush());
    await waitFor(() => expect(result.current.canEnablePush).toBe(false));
    expect(subscribe).toHaveBeenCalledTimes(2);
    expect(rpc).toHaveBeenCalledWith(
      "cc_register_push_subscription",
      expect.objectContaining({ p_player_token: "token" }),
    );
  } finally {
    if (original) Object.defineProperty(navigator, "serviceWorker", original);
    else Reflect.deleteProperty(navigator, "serviceWorker");
  }
});
