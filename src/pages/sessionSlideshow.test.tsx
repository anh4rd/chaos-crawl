import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
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

for (const kind of ["final", "secret"] as const) {
  describe(`${kind} TV route`, () => {
    const rpc =
      kind === "final"
        ? "cc_get_session_final_slideshow"
        : "cc_get_session_secret_review_slideshow";

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
