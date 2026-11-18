import { useEffect, useState } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import HostGuard from "./HostGuard";

type AuthListener = (event: AuthChangeEvent, session: Session | null) => void;
type SessionReply = { data: { session: Session | null }; error: Error | null };
const mocks = vi.hoisted(() => {
  const state: { listener: AuthListener | null } = { listener: null };
  return {
    state,
    getSession: vi.fn<() => Promise<SessionReply>>(),
    unsubscribe: vi.fn(),
    mounted: vi.fn(),
    unmounted: vi.fn(),
  };
});
vi.mock("../../lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: (listener: AuthListener) => {
        mocks.state.listener = listener;
        return { data: { subscription: { unsubscribe: mocks.unsubscribe } } };
      },
    },
  },
}));
function session(id: string, token = id): Session {
  return {
    access_token: token,
    refresh_token: "refresh",
    expires_in: 3600,
    token_type: "bearer",
    user: {
      id,
      aud: "authenticated",
      app_metadata: {},
      user_metadata: {},
      created_at: "2030-01-01",
    },
  };
}
function deferredSession() {
  let resolve: (value: SessionReply) => void = () => {
    throw new Error("Deferred session has not initialized");
  };
  const promise = new Promise<SessionReply>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}
function DraftPage() {
  const [draft, setDraft] = useState("");
  useEffect(() => {
    mocks.mounted();
    return () => mocks.unmounted();
  }, []);
  return (
    <label>
      Private draft
      <input value={draft} onChange={(event) => setDraft(event.target.value)} />
    </label>
  );
}
function openGuard() {
  return render(
    <MemoryRouter initialEntries={["/private"]}>
      <Routes>
        <Route element={<HostGuard />}>
          <Route path="/private" element={<DraftPage />} />
        </Route>
        <Route path="/host/login" element={<p>Host login</p>} />
      </Routes>
    </MemoryRouter>,
  );
}
function notify(next: Session | null, event: AuthChangeEvent = "SIGNED_IN") {
  const listener = mocks.state.listener;
  if (!listener) throw new Error("Auth listener has not subscribed");
  act(() => listener(event, next));
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.state.listener = null;
  mocks.getSession.mockResolvedValue({
    data: { session: session("host-a") },
    error: null,
  });
});
afterEach(cleanup);

it("remounts private state when the authenticated host changes", async () => {
  openGuard();
  fireEvent.change(await screen.findByLabelText("Private draft"), {
    target: { value: "Host A draft" },
  });
  notify(session("host-b"));
  expect(screen.getByLabelText("Private draft")).toHaveProperty("value", "");
  expect(mocks.mounted).toHaveBeenCalledTimes(2);
  expect(mocks.unmounted).toHaveBeenCalledTimes(1);
});
it("retains private state and subscriptions when the same host refreshes a token", async () => {
  openGuard();
  fireEvent.change(await screen.findByLabelText("Private draft"), {
    target: { value: "Keep draft" },
  });
  notify(session("host-a", "rotated-token"), "TOKEN_REFRESHED");
  expect(screen.getByLabelText("Private draft")).toHaveProperty(
    "value",
    "Keep draft",
  );
  expect(mocks.mounted).toHaveBeenCalledTimes(1);
  expect(mocks.unmounted).not.toHaveBeenCalled();
});
it("does not restore a signed-out host from obsolete initial recovery", async () => {
  const pending = deferredSession();
  mocks.getSession.mockReturnValue(pending.promise);
  openGuard();
  notify(null, "SIGNED_OUT");
  await act(async () =>
    pending.resolve({ data: { session: session("host-a") }, error: null }),
  );
  expect(screen.getByText("Host login")).toBeTruthy();
  expect(screen.queryByLabelText("Private draft")).toBeNull();
});
it("does not remount the new host when old initial recovery finishes", async () => {
  const pending = deferredSession();
  mocks.getSession.mockReturnValue(pending.promise);
  openGuard();
  notify(session("host-b"));
  fireEvent.change(screen.getByLabelText("Private draft"), {
    target: { value: "Host B draft" },
  });
  await act(async () =>
    pending.resolve({ data: { session: session("host-a") }, error: null }),
  );
  expect(screen.getByLabelText("Private draft")).toHaveProperty(
    "value",
    "Host B draft",
  );
  expect(mocks.mounted).toHaveBeenCalledTimes(1);
});
it("unsubscribes and ignores initial recovery after unmount", async () => {
  const pending = deferredSession();
  mocks.getSession.mockReturnValue(pending.promise);
  const view = openGuard();
  view.unmount();
  await act(async () =>
    pending.resolve({ data: { session: session("host-a") }, error: null }),
  );
  expect(mocks.unsubscribe).toHaveBeenCalledTimes(1);
  expect(mocks.mounted).not.toHaveBeenCalled();
});

it("ignores obsolete empty recovery after a host has signed in", async () => {
  const pending = deferredSession();
  mocks.getSession.mockReturnValue(pending.promise);
  openGuard();
  notify(session("host-b"));
  fireEvent.change(screen.getByLabelText("Private draft"), {
    target: { value: "Host B draft" },
  });
  await act(async () =>
    pending.resolve({ data: { session: null }, error: null }),
  );
  expect(screen.queryByText("Host login")).toBeNull();
  expect(screen.getByLabelText("Private draft")).toHaveProperty(
    "value",
    "Host B draft",
  );
});
