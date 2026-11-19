import { StrictMode, type PropsWithChildren } from "react";
import type { User } from "@supabase/supabase-js";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import HostExplore from "./HostExplore";
import { readHostIdentity } from "../lib/hostAuth";
import { readPlatformAdmin } from "../lib/hostHubQueries";
import {
  readCommunitySubmissions,
  readExploreFavourites,
} from "../lib/hostExploreQueries";
import {
  createCommunityChallenge,
  deleteApprovedCommunityChallenge,
  reviewPendingCommunitySubmission,
  saveExploreFavourite,
} from "../lib/hostExploreCommands";
import type { CommunitySubmission } from "../types/hostExplore";
import type { ApiResult } from "../lib/apiResult";

// jsdom has no native dialog/top-layer implementation; browser regressions cover modality.
vi.mock("../components/ui/useModalDialog", async () => {
  const { useRef, useLayoutEffect } = await import("react");
  return {
    useModalDialog: () => {
      const ref = useRef<HTMLDialogElement>(null);
      useLayoutEffect(() => {
        ref.current?.setAttribute("open", "");
      }, []);
      return ref;
    },
  };
});

vi.mock("../lib/hostAuth", () => ({ readHostIdentity: vi.fn() }));
vi.mock("../lib/hostHubQueries", () => ({ readPlatformAdmin: vi.fn() }));
vi.mock("../lib/hostExploreQueries", () => ({
  readCommunitySubmissions: vi.fn(),
  readExploreFavourites: vi.fn(),
}));
vi.mock("../lib/hostExploreCommands", () => ({
  createCommunityChallenge: vi.fn(),
  deleteApprovedCommunityChallenge: vi.fn(),
  reviewPendingCommunitySubmission: vi.fn(),
  saveExploreFavourite: vi.fn(),
  updateApprovedCommunityChallenge: vi.fn(),
}));
vi.mock("../lib/hostSavedCommands", () => ({ removeHostFavourite: vi.fn() }));
vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }));
vi.mock("../features/host-workspace/HostWorkspace", () => ({
  default: ({ children }: PropsWithChildren) => <main>{children}</main>,
}));

type IdentityReply = Awaited<ReturnType<typeof readHostIdentity>>;
function identity(id = "host"): IdentityReply {
  const user: User = {
    id,
    aud: "authenticated",
    app_metadata: {},
    user_metadata: {},
    created_at: "2030-01-01T12:00:00Z",
  };
  return { data: { user }, error: null };
}
function deferred<T>() {
  let resolve: (value: T) => void = () => {
    throw new Error("Deferred request not initialized");
  };
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { resolve, promise };
}
function submission(
  title = "Current challenge",
  status: CommunitySubmission["status"] = "approved",
): CommunitySubmission {
  return {
    id: title,
    item_type: "challenge",
    title,
    description: "Build together.",
    payload: { kind: "main", points: 10, minutes: 5 },
    status,
    submitted_by: "host",
    review_note: null,
    created_at: "2030-01-01T12:00:00Z",
  };
}
async function initialReads() {
  await waitFor(() =>
    expect(readCommunitySubmissions).toHaveBeenCalledTimes(1),
  );
  await waitFor(() =>
    expect(screen.queryByText("Checking your saved items…")).toBeNull(),
  );
}
async function contribute() {
  fireEvent.click(screen.getByRole("button", { name: "Create challenge" }));
  fireEvent.change(screen.getByLabelText("Challenge title"), {
    target: { value: "New idea" },
  });
  fireEvent.change(screen.getByLabelText("How does it work?"), {
    target: { value: "New rules" },
  });
  const form = screen.getByLabelText("Challenge title").closest("form");
  if (!form) throw new Error("Contribution form missing");
  fireEvent.submit(form);
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(readHostIdentity).mockResolvedValue(identity());
  vi.mocked(readPlatformAdmin).mockResolvedValue({ data: false, error: null });
  vi.mocked(readCommunitySubmissions).mockResolvedValue({
    data: [],
    error: null,
  });
  vi.mocked(readExploreFavourites).mockResolvedValue({ data: [], error: null });
  vi.mocked(saveExploreFavourite).mockResolvedValue({
    data: {
      id: "favourite",
      item_type: "task",
      item_id: "task-best-thing",
      item_data: {},
    },
    error: null,
  });
  vi.mocked(createCommunityChallenge).mockResolvedValue({
    data: null,
    error: null,
  });
  vi.mocked(deleteApprovedCommunityChallenge).mockResolvedValue({
    data: null,
    error: null,
  });
  vi.mocked(reviewPendingCommunitySubmission).mockResolvedValue({
    data: null,
    error: null,
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("does not start either collection query after unmounted identity responses", async () => {
  const pending = deferred<IdentityReply>();
  vi.mocked(readHostIdentity).mockReturnValue(pending.promise);
  const page = render(<HostExplore />);
  page.unmount();
  await act(async () => {
    pending.resolve(identity());
    await pending.promise;
  });
  expect(readExploreFavourites).not.toHaveBeenCalled();
  expect(readCommunitySubmissions).not.toHaveBeenCalled();
});

it("ignores obsolete StrictMode identities instead of starting duplicate reads", async () => {
  const oldFavourite = deferred<IdentityReply>(),
    oldCommunity = deferred<IdentityReply>();
  vi.mocked(readHostIdentity)
    .mockReturnValueOnce(oldFavourite.promise)
    .mockReturnValueOnce(oldCommunity.promise)
    .mockResolvedValue(identity("current-host"));
  render(
    <StrictMode>
      <HostExplore />
    </StrictMode>,
  );
  await initialReads();
  await act(async () => {
    oldFavourite.resolve(identity("old-host"));
    oldCommunity.resolve(identity("old-host"));
    await Promise.all([oldFavourite.promise, oldCommunity.promise]);
  });
  expect(readExploreFavourites).toHaveBeenCalledExactlyOnceWith("current-host");
  expect(readCommunitySubmissions).toHaveBeenCalledTimes(1);
});

it("keeps the refreshed catalogue when an earlier collection response arrives later", async () => {
  const oldRead = deferred<ApiResult<CommunitySubmission[]>>();
  vi.mocked(readCommunitySubmissions)
    .mockReturnValueOnce(oldRead.promise)
    .mockResolvedValue({ data: [submission()], error: null });
  render(<HostExplore />);
  await initialReads();
  await contribute();
  await screen.findByRole("heading", { name: "Current challenge" });
  await act(async () => {
    oldRead.resolve({ data: [submission("Obsolete challenge")], error: null });
    await oldRead.promise;
  });
  expect(
    screen.queryByRole("heading", { name: "Obsolete challenge" }),
  ).toBeNull();
  expect(
    screen.getByRole("heading", { name: "Current challenge" }),
  ).toBeTruthy();
});

it("keeps failed command feedback when a current collection read later fails", async () => {
  const pending = deferred<ApiResult<CommunitySubmission[]>>();
  vi.mocked(readCommunitySubmissions).mockReturnValue(pending.promise);
  vi.mocked(saveExploreFavourite).mockResolvedValue({
    data: null,
    error: { message: "Saving blocked" },
  });
  render(<HostExplore />);
  await initialReads();
  fireEvent.click(
    screen.getByRole("button", { name: "Save Obtain the best thing" }),
  );
  expect((await screen.findByRole("alert")).textContent).toBe("Saving blocked");
  await act(async () => {
    pending.resolve({
      data: null,
      error: { message: "Collection unavailable" },
    });
    await pending.promise;
  });
  expect(screen.getByRole("alert").textContent).toBe("Saving blocked");
});

it("does not issue a save after its identity response outlives the page", async () => {
  const page = render(<HostExplore />);
  await initialReads();
  const pending = deferred<IdentityReply>();
  vi.mocked(readHostIdentity).mockReturnValueOnce(pending.promise);
  fireEvent.click(
    screen.getByRole("button", { name: "Save Obtain the best thing" }),
  );
  page.unmount();
  await act(async () => {
    pending.resolve(identity());
    await pending.promise;
  });
  expect(saveExploreFavourite).not.toHaveBeenCalled();
});

it("does not reload after an already-issued contribution completes off-page", async () => {
  const pending = deferred<ApiResult<unknown>>();
  vi.mocked(createCommunityChallenge).mockReturnValue(pending.promise);
  const page = render(<HostExplore />);
  await initialReads();
  await contribute();
  await waitFor(() =>
    expect(createCommunityChallenge).toHaveBeenCalledTimes(1),
  );
  const identityCount = vi.mocked(readHostIdentity).mock.calls.length;
  page.unmount();
  await act(async () => {
    pending.resolve({ data: null, error: null });
    await pending.promise;
  });
  expect(readHostIdentity).toHaveBeenCalledTimes(identityCount);
  expect(readCommunitySubmissions).toHaveBeenCalledTimes(1);
});

it("does not reload after an approved deletion completes off-page", async () => {
  vi.mocked(readPlatformAdmin).mockResolvedValue({ data: true, error: null });
  vi.mocked(readCommunitySubmissions).mockResolvedValue({
    data: [submission()],
    error: null,
  });
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const pending = deferred<ApiResult<unknown>>();
  vi.mocked(deleteApprovedCommunityChallenge).mockReturnValue(pending.promise);
  const page = render(<HostExplore />);
  fireEvent.click(await screen.findByRole("button", { name: "Delete" }));
  await waitFor(() =>
    expect(deleteApprovedCommunityChallenge).toHaveBeenCalledTimes(1),
  );
  const identityCount = vi.mocked(readHostIdentity).mock.calls.length;
  page.unmount();
  await act(async () => {
    pending.resolve({ data: null, error: null });
    await pending.promise;
  });
  expect(readHostIdentity).toHaveBeenCalledTimes(identityCount);
  expect(readCommunitySubmissions).toHaveBeenCalledTimes(1);
});

it("does not issue moderation after its identity response outlives the page", async () => {
  vi.mocked(readPlatformAdmin).mockResolvedValue({ data: true, error: null });
  vi.mocked(readCommunitySubmissions).mockResolvedValue({
    data: [submission("Pending challenge", "pending")],
    error: null,
  });
  const page = render(<HostExplore />);
  const approve = await screen.findByRole("button", { name: "Approve" });
  const pending = deferred<IdentityReply>();
  vi.mocked(readHostIdentity).mockReturnValueOnce(pending.promise);
  fireEvent.click(approve);
  page.unmount();
  await act(async () => {
    pending.resolve(identity());
    await pending.promise;
  });
  expect(reviewPendingCommunitySubmission).not.toHaveBeenCalled();
});

it("ignores a contribution identity response after the dialog closes", async () => {
  render(<HostExplore />);
  await initialReads();
  const pending = deferred<IdentityReply>();
  vi.mocked(readHostIdentity).mockReturnValueOnce(pending.promise);
  await contribute();
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  await act(async () => {
    pending.resolve(identity());
    await pending.promise;
  });
  expect(createCommunityChallenge).not.toHaveBeenCalled();
  expect(readCommunitySubmissions).toHaveBeenCalledTimes(1);
});

it.each([false, true])(
  "does not overwrite a fresh draft when a closed contribution finishes (failure: %s)",
  async (failed) => {
    const pending = deferred<ApiResult<unknown>>();
    vi.mocked(createCommunityChallenge).mockReturnValue(pending.promise);
    render(<HostExplore />);
    await initialReads();
    await contribute();
    await waitFor(() =>
      expect(createCommunityChallenge).toHaveBeenCalledTimes(1),
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Create challenge" }));
    fireEvent.change(screen.getByLabelText("Challenge title"), {
      target: { value: "Fresh draft" },
    });
    await act(async () => {
      pending.resolve({
        data: null,
        error: failed ? { message: "Obsolete contribution failure" } : null,
      });
      await pending.promise;
    });
    expect(screen.getByLabelText("Challenge title")).toHaveProperty(
      "value",
      "Fresh draft",
    );
    expect(screen.queryByText("Obsolete contribution failure")).toBeNull();
    expect(readCommunitySubmissions).toHaveBeenCalledTimes(1);
  },
);

it("locks repeated contribution submits synchronously before identity resolves", async () => {
  render(<HostExplore />);
  await initialReads();
  const pending = deferred<IdentityReply>();
  vi.mocked(readHostIdentity).mockReturnValue(pending.promise);
  await contribute();
  const form = screen.getByLabelText("Challenge title").closest("form");
  if (!form) throw new Error("Contribution form missing");
  fireEvent.submit(form);
  const before = vi.mocked(readHostIdentity).mock.calls.length;
  await act(async () => {
    pending.resolve(identity());
    await pending.promise;
  });
  expect(createCommunityChallenge).toHaveBeenCalledTimes(1);
  expect(vi.mocked(readHostIdentity).mock.calls.length).toBe(before + 1);
});

it("does not release a fresh pending submit when an obsolete write completes", async () => {
  const oldWrite = deferred<ApiResult<unknown>>(),
    freshWrite = deferred<ApiResult<unknown>>();
  vi.mocked(createCommunityChallenge)
    .mockReturnValueOnce(oldWrite.promise)
    .mockReturnValueOnce(freshWrite.promise);
  render(<HostExplore />);
  await initialReads();
  await contribute();
  await waitFor(() =>
    expect(createCommunityChallenge).toHaveBeenCalledTimes(1),
  );
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  await contribute();
  await waitFor(() =>
    expect(createCommunityChallenge).toHaveBeenCalledTimes(2),
  );
  await act(async () => {
    oldWrite.resolve({ data: null, error: null });
    await oldWrite.promise;
  });
  expect(screen.getByRole("button", { name: "Submitting…" })).toHaveProperty(
    "disabled",
    true,
  );
  expect(readCommunitySubmissions).toHaveBeenCalledTimes(1);
  await act(async () => {
    freshWrite.resolve({ data: null, error: null });
    await freshWrite.promise;
  });
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(readCommunitySubmissions).toHaveBeenCalledTimes(2);
});

it("releases a rejected identity lookup and allows a current-dialog retry", async () => {
  render(<HostExplore />);
  await initialReads();
  vi.mocked(readHostIdentity).mockRejectedValueOnce(
    new Error("Identity unavailable"),
  );
  await contribute();
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Identity unavailable",
  );
  expect(
    screen.getByRole("button", { name: "Submit for review" }),
  ).toHaveProperty("disabled", false);
  const form = screen.getByLabelText("Challenge title").closest("form");
  if (!form) throw new Error("Contribution form missing");
  fireEvent.submit(form);
  await waitFor(() =>
    expect(createCommunityChallenge).toHaveBeenCalledTimes(1),
  );
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});
