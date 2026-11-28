import { useCallback, useEffect, useRef, useState } from "react";
import { runApi } from "../../lib/apiResult";
import { supabase } from "../../lib/sessionSupabase";

type PlayerNotification = {
  id: string;
  body: string;
};

function isNotification(value: unknown): value is PlayerNotification {
  if (!value || typeof value !== "object") return false;
  return (
    "id" in value &&
    typeof value.id === "string" &&
    "body" in value &&
    typeof value.body === "string"
  );
}

function publicKey(value: string): Uint8Array<ArrayBuffer> {
  const decoded = window.atob(value.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

export function usePlayerNotifications(code: string, token: string | null) {
  const [snapshot, setSnapshot] = useState<{
    code: string;
    token: string | null;
    notifications: PlayerNotification[];
  }>({ code, token, notifications: [] });
  const [queryError, setQueryError] = useState("");
  const [actionError, setActionError] = useState("");
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const requestVersion = useRef(0);
  const pushLock = useRef(false);
  const key = import.meta.env.VITE_VAPID_PUBLIC_KEY;

  const register = useCallback(
    async (subscription: PushSubscription) => {
      const value = subscription.toJSON();
      if (!token || !value.endpoint || !value.keys?.p256dh || !value.keys.auth)
        throw new Error(
          "The browser returned an incomplete push subscription.",
        );
      const result = await runApi(() =>
        supabase.rpc("cc_register_push_subscription", {
          p_join_code: code,
          p_player_token: token,
          p_endpoint: value.endpoint,
          p_p256dh: value.keys?.p256dh,
          p_auth: value.keys?.auth,
        }),
      );
      if (result.error) throw new Error(result.error.message);
    },
    [code, token],
  );

  useEffect(() => {
    const current = ++generation.current;
    setSnapshot({ code, token, notifications: [] });
    setEnabled(false);
    setBusy(false);
    pushLock.current = false;
    setQueryError("");
    setActionError("");
    if (!token) return;
    let inFlight = false;
    const refresh = async () => {
      if (inFlight) return;
      inFlight = true;
      const version = ++requestVersion.current;
      const result = await runApi(() =>
        supabase.rpc("cc_get_player_notifications", {
          p_join_code: code,
          p_player_token: token,
        }),
      );
      inFlight = false;
      if (generation.current !== current || requestVersion.current !== version)
        return;
      if (result.error) {
        setQueryError(
          `Game notifications couldn't refresh: ${result.error.message}`,
        );
      } else {
        const data: unknown = result.data;
        if (!Array.isArray(data) || !data.every(isNotification)) {
          setQueryError("Game notifications returned an invalid response.");
          return;
        }
        setSnapshot({ code, token, notifications: data });
        setQueryError("");
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => {
      generation.current += 1;
      window.clearInterval(timer);
    };
  }, [code, token]);

  useEffect(() => {
    if (!token || !("serviceWorker" in navigator) || !("PushManager" in window))
      return;
    if (!key) {
      if (import.meta.env.PROD)
        setActionError("Game alerts aren't configured on this deployment.");
      return;
    }
    let active = true;
    void navigator.serviceWorker.ready
      .then(async (worker) => {
        if (!active) return;
        setRegistration(worker);
        const existing = await worker.pushManager.getSubscription();
        if (!existing || !active) return;
        await register(existing);
        if (active) setEnabled(true);
      })
      .catch(() => {
        if (active)
          setActionError("Game alerts couldn't be enabled. Please try again.");
      });
    return () => {
      active = false;
      setRegistration(null);
    };
  }, [key, register, token]);

  function enablePush() {
    if (!registration || !key || pushLock.current) return;
    const current = generation.current;
    pushLock.current = true;
    setBusy(true);
    setActionError("");
    let applicationServerKey: Uint8Array<ArrayBuffer>;
    try {
      applicationServerKey = publicKey(key);
    } catch {
      setBusy(false);
      pushLock.current = false;
      setActionError("Game alerts are not configured correctly.");
      return;
    }
    void registration.pushManager
      .subscribe({ userVisibleOnly: true, applicationServerKey })
      .then((subscription) => {
        if (generation.current === current) return register(subscription);
      })
      .then(() => {
        if (generation.current === current) setEnabled(true);
      })
      .catch(() => {
        if (generation.current === current)
          setActionError(
            "Game alerts couldn't be enabled. Check notification permission and try again. In-game notifications are still available.",
          );
      })
      .finally(() => {
        if (generation.current === current) {
          pushLock.current = false;
          setBusy(false);
        }
      });
  }

  async function dismiss(id: string) {
    if (!token) return;
    const current = generation.current;
    setActionError("");
    const result = await runApi(() =>
      supabase.rpc("cc_dismiss_player_notification", {
        p_join_code: code,
        p_player_token: token,
        p_notification_id: id,
      }),
    );
    if (generation.current !== current) return;
    if (result.error)
      setActionError(
        `Notification couldn't be dismissed: ${result.error.message}`,
      );
    else {
      requestVersion.current += 1;
      setSnapshot((previous) =>
        previous.code === code && previous.token === token
          ? {
              ...previous,
              notifications: previous.notifications.filter(
                (item) => item.id !== id,
              ),
            }
          : previous,
      );
    }
  }

  return {
    notifications:
      snapshot.code === code && snapshot.token === token
        ? snapshot.notifications
        : [],
    error: actionError || queryError,
    canEnablePush: Boolean(registration && !enabled),
    busy,
    enablePush,
    dismiss,
  };
}
