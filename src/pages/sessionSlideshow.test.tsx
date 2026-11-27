import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import {
  MemoryRouter,
  Route,
  Routes,
  createMemoryRouter,
  RouterProvider,
} from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SessionFinalSlideshow from "./SessionFinalSlideshow";
import SessionSecretSlideshow from "./SessionSecretSlideshow";

const backend = vi.hoisted(() => ({
  rpc: vi.fn(),
  bucket: vi.fn(),
  publicUrl: vi.fn((path: string) => ({
    data: { publicUrl: `/evidence/${path}` },
  })),
}));
vi.mock("../lib/monitoring", () => ({ reportError: vi.fn() }));
vi.mock("../lib/sessionSupabase", () => ({
  supabase: {
    rpc: backend.rpc,
    storage: { from: backend.bucket },
  },
}));

function evidence(id: string, mediaType: "image" | "video" = "image") {
  return {
    id,
    player_name: id === "first" ? "Pat" : "Alex",
    challenge_id: "challenge",
    challenge_title: "Team portrait",
    media_type: mediaType,
    storage_path: `${id}.${mediaType === "image" ? "jpg" : "webm"}`,
  };
}
function view() {
  return {
    open: true,
    challenge_id: "challenge",
    assignment_id: "assignment",
    evidence_id: "first",
    mission: {
      title: "Secret toast",
      description: "Give a toast without being noticed.",
      player_name: "Pat",
    },
    items: [evidence("first"), evidence("second", "video")],
  };
}
function deferred<T>() {
  let resolve: (value: T) => void = () => {
    throw new Error("Deferred result is not initialized");
  };
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}
async function advance(milliseconds = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
}
function mount(kind: "final" | "secret") {
  return render(
    <MemoryRouter initialEntries={[`/${kind}-slideshow/session-a`]}>
      <Routes>
        <Route
          path="/final-slideshow/:sessionId"
          element={<SessionFinalSlideshow />}
        />
        <Route
          path="/secret-slideshow/:sessionId"
          element={<SessionSecretSlideshow />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

function navigable(kind: "final" | "secret") {
  const router = createMemoryRouter(
    [
      {
        path: "/final-slideshow/:sessionId",
        element: <SessionFinalSlideshow />,
      },
      {
        path: "/secret-slideshow/:sessionId",
        element: <SessionSecretSlideshow />,
      },
    ],
    { initialEntries: [`/${kind}-slideshow/session-a`] },
  );
  return { router, ...render(<RouterProvider router={router} />) };
}
function nextView() {
  return {
    ...view(),
    mission: {
      title: "New mission",
      description: "Current rules.",
      player_name: "New player",
    },
    items: view().items.map((item) => ({
      ...item,
      player_name: "New player",
      challenge_title: "New challenge",
    })),
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  backend.rpc.mockReset();
  backend.bucket.mockReturnValue({ getPublicUrl: backend.publicUrl });
  backend.rpc.mockResolvedValue({ data: view(), error: null });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  Reflect.deleteProperty(document.documentElement, "requestFullscreen");
});

it("introduces a text mission before revealing its answer and resets for another mission", async () => {
  backend.rpc.mockResolvedValue({
    data: {
      ...view(),
      evidence_id: null,
      items: [],
      answer: "A secret answer",
    },
    error: null,
  });
  mount("secret");
  await advance();
  expect(screen.getByRole("heading", { name: "Secret toast" })).toBeDefined();
  expect(screen.getByText(/SECRET MISSION · Pat/)).toBeDefined();
  expect(screen.queryByText("A secret answer")).toBeNull();
  await advance(5000);
  expect(screen.getByText("A secret answer")).toBeDefined();
  backend.rpc.mockResolvedValue({
    data: {
      ...nextView(),
      assignment_id: "second",
      evidence_id: null,
      items: [],
      answer: "Another answer",
    },
    error: null,
  });
  await advance(1500);
  expect(screen.getByRole("heading", { name: "New mission" })).toBeDefined();
  expect(screen.queryByText("Another answer")).toBeNull();
  await advance(5000);
  expect(screen.getByText("Another answer")).toBeDefined();
  backend.rpc.mockResolvedValue({
    data: {
      ...nextView(),
      assignment_id: "second",
      review_opened_at: "2030-01-01T12:05:00Z",
      evidence_id: null,
      items: [],
      answer: "Another answer",
    },
    error: null,
  });
  await advance(1500);
  expect(screen.queryByText("Another answer")).toBeNull();
  await advance(5000);
  expect(screen.getByText("Another answer")).toBeDefined();
});

for (const kind of ["final", "secret"] as const) {
  describe(`${kind} TV route`, () => {
    const rpc =
      kind === "final"
        ? "cc_get_session_final_slideshow"
        : "cc_get_session_secret_review_slideshow";

    it("removes previous-session evidence and media feedback while the next identity connects", async () => {
      const { router } = navigable(kind);
      await advance();
      fireEvent.error(screen.getByRole("img"));
      expect(screen.getByRole("status")).toBeDefined();
      const pending = deferred<{
        data: ReturnType<typeof view>;
        error: null;
      }>();
      backend.rpc.mockReturnValueOnce(pending.promise);
      await act(async () => router.navigate(`/${kind}-slideshow/session-b`));
      expect(screen.queryByRole("img")).toBeNull();
      expect(screen.queryByRole("heading", { name: "Pat" })).toBeNull();
      expect(screen.queryByRole("status")).toBeNull();
      expect(screen.getByText(/Connecting to the .*slideshow/)).toBeDefined();
      expect(backend.rpc).toHaveBeenLastCalledWith(rpc, {
        p_session_id: "session-b",
      });
      await act(async () => pending.resolve({ data: nextView(), error: null }));
      expect(screen.getByRole("heading", { name: "New player" })).toBeDefined();
    });

    it("shows only the current identity read failure instead of previous-session evidence", async () => {
      const { router } = navigable(kind);
      await advance();
      backend.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: "New session unavailable" },
      });
      await act(async () => router.navigate(`/${kind}-slideshow/session-b`));
      await advance();
      expect(screen.queryByRole("img")).toBeNull();
      expect(screen.queryByRole("heading", { name: "Pat" })).toBeNull();
      expect(screen.getByRole("alert").textContent).toContain(
        "New session unavailable",
      );
      const pending = deferred<{
        data: ReturnType<typeof view>;
        error: null;
      }>();
      backend.rpc.mockReturnValueOnce(pending.promise);
      await act(async () => router.navigate(`/${kind}-slideshow/session-c`));
      expect(screen.queryByRole("alert")).toBeNull();
      expect(screen.getByText(/Connecting to the .*slideshow/)).toBeDefined();
    });

    it("resets local playback across A-to-B-to-A navigation even when host evidence identifiers match", async () => {
      backend.rpc.mockResolvedValue({
        data: { ...view(), evidence_id: null },
        error: null,
      });
      const { router } = navigable(kind);
      await advance();
      await advance(6000);
      expect(screen.getByText("2 / 2")).toBeDefined();
      await act(async () => router.navigate(`/${kind}-slideshow/session-b`));
      await advance();
      expect(screen.getByText("1 / 2")).toBeDefined();
      await advance(6000);
      expect(screen.getByText("2 / 2")).toBeDefined();
      await act(async () => router.navigate(`/${kind}-slideshow/session-a`));
      await advance();
      expect(screen.getByText("1 / 2")).toBeDefined();
    });

    it.each(["success", "failure"] as const)(
      "ignores an obsolete prior-session read %s after A-to-B-to-A navigation",
      async (outcome) => {
        const { router } = navigable(kind);
        await advance();
        const pending = deferred<{
          data: ReturnType<typeof view> | null;
          error: { message: string } | null;
        }>();
        backend.rpc.mockReturnValueOnce(pending.promise);
        await advance(1500);
        backend.rpc.mockResolvedValue({ data: nextView(), error: null });
        await act(async () => router.navigate(`/${kind}-slideshow/session-b`));
        await advance();
        await act(async () => router.navigate(`/${kind}-slideshow/session-a`));
        await advance();
        await act(async () =>
          pending.resolve(
            outcome === "success"
              ? { data: view(), error: null }
              : { data: null, error: { message: "Obsolete read" } },
          ),
        );
        expect(
          screen.getByRole("heading", { name: "New player" }),
        ).toBeDefined();
        expect(screen.queryByRole("status")).toBeNull();
        expect(screen.queryByRole("alert")).toBeNull();
      },
    );

    it("ignores a fullscreen rejection from the previous session", async () => {
      let reject: (error: Error) => void = () => {
        throw new Error("Fullscreen request not initialized");
      };
      const fullscreen = new Promise<void>((_resolve, fail) => {
        reject = fail;
      });
      Object.defineProperty(document.documentElement, "requestFullscreen", {
        configurable: true,
        value: () => fullscreen,
      });
      const { router } = navigable(kind);
      await advance();
      fireEvent.click(screen.getByRole("button", { name: "Enter fullscreen" }));
      backend.rpc.mockResolvedValue({ data: nextView(), error: null });
      await act(async () => router.navigate(`/${kind}-slideshow/session-b`));
      await advance();
      await act(async () => reject(new Error("Old fullscreen request")));
      expect(screen.getByRole("heading", { name: "New player" })).toBeDefined();
      expect(screen.queryByRole("status")).toBeNull();
    });

    it("renders the first host-selected gallery atomically without exposing the unselected image", async () => {
      backend.rpc.mockResolvedValue({
        data: { ...view(), evidence_id: "second" },
        error: null,
      });
      const { container } = mount(kind);
      const mountedMedia: string[] = [];
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (!(node instanceof Element)) continue;
            for (const element of [
              node,
              ...node.querySelectorAll("img,video"),
            ]) {
              if (element.matches("img,video"))
                mountedMedia.push(element.tagName);
            }
          }
        }
      });
      observer.observe(container, { childList: true, subtree: true });
      await advance();
      observer.disconnect();
      expect(screen.getByText("2 / 2")).toBeDefined();
      expect(container.querySelector("video")?.getAttribute("src")).toBe(
        "/evidence/second.webm",
      );
      expect(mountedMedia).toContain("VIDEO");
      expect(mountedMedia).not.toContain("IMG");
    });

    it("reports a thrown read failure and recovers on the next polling cadence", async () => {
      backend.rpc.mockRejectedValueOnce(new Error("Transport unavailable"));
      mount(kind);
      await advance();
      expect(screen.getByRole("alert").textContent).toContain(
        "Transport unavailable",
      );
      await advance(1500);
      expect(screen.queryByRole("alert")).toBeNull();
      expect(screen.getByRole("heading", { name: "Pat" })).toBeDefined();
    });

    it("connects through the public read contract and resolves the evidence bucket", async () => {
      const pending = deferred<{
        data: ReturnType<typeof view>;
        error: null;
      }>();
      backend.rpc.mockReturnValueOnce(pending.promise);
      mount(kind);
      expect(screen.getByText(/Connecting to the .*slideshow/)).toBeDefined();
      expect(backend.rpc).toHaveBeenCalledExactlyOnceWith(rpc, {
        p_session_id: "session-a",
      });
      await act(async () => pending.resolve({ data: view(), error: null }));
      const image = screen.getByRole("img");
      expect(image.getAttribute("src")).toBe("/evidence/first.jpg");
      expect(image.getAttribute("alt")).toBe(
        kind === "final"
          ? "Pat's entry for Team portrait"
          : "Evidence for Secret toast",
      );
      expect(backend.bucket).toHaveBeenCalledWith("session-evidence");
      expect(screen.getByRole("heading", { name: "Pat" })).toBeDefined();
      expect(screen.getByText("1 / 2")).toBeDefined();
      await advance(1500);
      expect(backend.rpc).toHaveBeenCalledTimes(2);
      expect(backend.rpc).toHaveBeenLastCalledWith(rpc, {
        p_session_id: "session-a",
      });
    });

    it("reports a first-read failure, then preserves waiting and empty-stage copy", async () => {
      backend.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: "offline" },
      });
      const closed = { ...view(), open: false };
      backend.rpc.mockResolvedValueOnce({ data: closed, error: null });
      backend.rpc.mockResolvedValue({
        data: { ...view(), items: [] },
        error: null,
      });
      mount(kind);
      await advance();
      expect(screen.getByRole("alert").textContent).toBe(
        kind === "final"
          ? "The TV slideshow couldn't load: offline"
          : "The secret mission slideshow couldn't load: offline",
      );
      await advance(1500);
      expect(
        screen.getByRole("heading", { name: "Slideshow is waiting" }),
      ).toBeDefined();
      expect(
        screen.queryByRole("button", { name: "Enter fullscreen" }),
      ).toBeNull();
      await advance(1500);
      expect(screen.queryByRole("alert")).toBeNull();
      if (kind === "final") {
        expect(
          screen.getByRole("heading", { name: "Waiting for submissions" }),
        ).toBeDefined();
        expect(
          screen.queryByRole("button", { name: "Enter fullscreen" }),
        ).toBeNull();
      } else {
        expect(
          screen.getByRole("heading", { name: "Secret toast" }),
        ).toBeDefined();
        expect(screen.getByText("No photo or video submitted")).toBeDefined();
        expect(
          screen.getByRole("button", { name: "Enter fullscreen" }),
        ).toBeDefined();
      }
    });

    it("retains local playback across polling, advances images at six seconds and wraps video completion", async () => {
      const { container } = mount(kind);
      await advance();
      await advance(5999);
      expect(screen.getByText("1 / 2")).toBeDefined();
      await advance(1);
      expect(screen.getByText("2 / 2")).toBeDefined();
      const video = container.querySelector("video");
      if (!video) throw new Error("Expected the second evidence video");
      expect(video.getAttribute("src")).toBe("/evidence/second.webm");
      expect(video.autoplay).toBe(true);
      expect(video.muted).toBe(true);
      expect(video.playsInline).toBe(true);
      await advance(14999);
      expect(screen.getByText("2 / 2")).toBeDefined();
      await advance(1);
      expect(screen.getByText("1 / 2")).toBeDefined();
      await advance(6000);
      const nextVideo = container.querySelector("video");
      if (!nextVideo)
        throw new Error("Expected video after another image interval");
      fireEvent.ended(nextVideo);
      expect(screen.getByText("1 / 2")).toBeDefined();
    });

    it("follows changed host selection, clamps a shortened gallery and ignores older completed reads", async () => {
      mount(kind);
      await advance();
      backend.rpc.mockResolvedValueOnce({
        data: { ...view(), evidence_id: "second" },
        error: null,
      });
      await advance(1500);
      expect(screen.getByText("2 / 2")).toBeDefined();
      const shortened = {
        ...view(),
        evidence_id: "second",
        items: [evidence("first")],
      };
      backend.rpc.mockResolvedValueOnce({ data: shortened, error: null });
      await advance(1500);
      expect(screen.getByText("1 / 1")).toBeDefined();
      const older = deferred<{ data: ReturnType<typeof view>; error: null }>();
      backend.rpc.mockReturnValueOnce(older.promise);
      await advance(1500);
      backend.rpc.mockResolvedValueOnce({
        data: {
          ...view(),
          evidence_id: "third",
          items: [evidence("first"), evidence("third", "video")],
        },
        error: null,
      });
      await advance(1500);
      expect(screen.getByText("2 / 2")).toBeDefined();
      await act(async () => older.resolve({ data: shortened, error: null }));
      expect(screen.getByText("2 / 2")).toBeDefined();
    });

    it("keeps media/fullscreen feedback on the current slide and resets media errors on identity change", async () => {
      const fullscreen = vi.fn().mockRejectedValue(new Error("denied"));
      Object.defineProperty(document.documentElement, "requestFullscreen", {
        configurable: true,
        value: fullscreen,
      });
      const { container } = mount(kind);
      await advance();
      fireEvent.error(screen.getByRole("img"));
      expect(screen.getByRole("status").textContent).toBe(
        "This photo couldn't load on the TV screen.",
      );
      fireEvent.click(screen.getByRole("button", { name: "Enter fullscreen" }));
      await advance();
      expect(fullscreen).toHaveBeenCalledOnce();
      expect(screen.getByRole("status").textContent).toBe(
        "Couldn't enter fullscreen: denied",
      );
      backend.rpc.mockResolvedValue({
        data: { ...view(), evidence_id: "second" },
        error: null,
      });
      await advance(1500);
      expect(screen.queryByRole("status")).toBeNull();
      const video = container.querySelector("video");
      if (!video) throw new Error("Expected host-selected video");
      fireEvent.error(video);
      expect(screen.getByRole("status").textContent).toBe(
        "This video couldn't play on the TV screen.",
      );
    });

    it("stops polling and ignores an outstanding result after unmount", async () => {
      const pending = deferred<{
        data: ReturnType<typeof view>;
        error: null;
      }>();
      backend.rpc.mockReturnValueOnce(pending.promise);
      const { unmount, container } = mount(kind);
      unmount();
      await act(async () => pending.resolve({ data: view(), error: null }));
      await advance(10000);
      expect(container.childElementCount).toBe(0);
      expect(backend.rpc).toHaveBeenCalledOnce();
      expect(backend.publicUrl).not.toHaveBeenCalled();
    });
  });
}
