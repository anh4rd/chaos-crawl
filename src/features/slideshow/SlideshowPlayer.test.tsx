import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Media } from "../../types/database";
import SlideshowPlayer from "./SlideshowPlayer";

const image = (id: string): Media => ({
  id,
  image_url: `${id}.jpg`,
  media_type: "image",
  player_id: null,
  uploaded_at: "2026-01-01",
  player_name: id,
  team: null,
  challenge: null,
  pub: null,
  points: 0,
});
const images = [image("first"), image("second"), image("third")];
const video: Media = {
  ...image("video"),
  image_url: "video.mp4",
  media_type: "video",
};
function player(media = images, isHost = true) {
  return (
    <SlideshowPlayer
      media={media}
      isHost={isHost}
      ending={false}
      end={vi.fn()}
      reload={vi.fn()}
    />
  );
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("advances images after five seconds, pauses and resumes without stale timers", () => {
  render(player());
  act(() => vi.advanceTimersByTime(4999));
  expect(screen.getByLabelText("Slide counter").textContent).toBe("1 / 3");
  fireEvent.click(screen.getByRole("button", { name: /Pause/ }));
  act(() => vi.advanceTimersByTime(10000));
  expect(screen.getByLabelText("Slide counter").textContent).toBe("1 / 3");
  fireEvent.click(screen.getByRole("button", { name: /Resume/ }));
  act(() => vi.advanceTimersByTime(5000));
  expect(screen.getByLabelText("Slide counter").textContent).toBe("2 / 3");
});

it("wraps keyboard navigation and ignores keys used by native controls", () => {
  render(player());
  fireEvent.keyDown(window, { key: "ArrowLeft" });
  expect(screen.getByLabelText("Slide counter").textContent).toBe("3 / 3");
  fireEvent.keyDown(window, { key: "ArrowRight" });
  expect(screen.getByLabelText("Slide counter").textContent).toBe("1 / 3");
  fireEvent.keyDown(window, { key: " " });
  expect(screen.getByText("PAUSED")).toBeDefined();
  fireEvent.keyDown(screen.getByRole("button", { name: /Next/ }), {
    key: "ArrowRight",
  });
  expect(screen.getByLabelText("Slide counter").textContent).toBe("1 / 3");
});

it("pauses the actual video and resumes playback; video ending drives advancement", () => {
  const { container } = render(player([video, images[0]]));
  const element = container.querySelector("video");
  if (!element) throw new Error("Expected current native video");
  expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();
  act(() => vi.advanceTimersByTime(10000));
  expect(screen.getByLabelText("Slide counter").textContent).toBe("1 / 2");
  fireEvent.click(screen.getByRole("button", { name: /Pause/ }));
  expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  fireEvent.ended(element);
  expect(screen.getByLabelText("Slide counter").textContent).toBe("1 / 2");
  fireEvent.click(screen.getByRole("button", { name: /Resume/ }));
  expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);
  fireEvent.ended(element);
  expect(screen.getByLabelText("Slide counter").textContent).toBe("2 / 2");
});

it("allows manual playback after autoplay rejection and recovers from a broken upload", async () => {
  vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValue(
    new Error("autoplay blocked"),
  );
  const { container } = render(player([video, images[0]]));
  await act(async () => {});
  expect(screen.getByRole("status").textContent).toContain("video controls");
  const element = container.querySelector("video");
  if (!element) throw new Error("Expected failed native video");
  fireEvent.error(element);
  fireEvent.click(screen.getByRole("button", { name: "Skip to next" }));
  expect(screen.getByAltText("Chaos Crawl upload").getAttribute("src")).toBe(
    "first.jpg",
  );
  expect(screen.queryByText("Could not load this upload")).toBeNull();
});

it("preloads only the next image and cancels timers/listeners/video on unmount", () => {
  const preloaded: HTMLImageElement[] = [];
  vi.stubGlobal(
    "Image",
    class {
      constructor() {
        const node = document.createElement("img");
        preloaded.push(node);
        return node;
      }
    },
  );
  const { rerender, unmount } = render(player([images[0], video]));
  expect(preloaded).toHaveLength(0);
  fireEvent.keyDown(window, { key: "ArrowRight" });
  expect(preloaded[0].getAttribute("src")).toBe("first.jpg");
  rerender(player([images[0]]));
  expect(screen.getByLabelText("Slide counter").textContent).toBe("1 / 1");
  expect(preloaded[0].getAttribute("src")).toBeNull();
  unmount();
  expect(vi.getTimerCount()).toBe(0);
  fireEvent.keyDown(window, { key: "ArrowRight" });
  vi.unstubAllGlobals();
});

it("hides host controls for players and offers refresh on an empty slideshow", () => {
  const { rerender } = render(player(images, false));
  expect(screen.queryByRole("button", { name: /End Slideshow/ })).toBeNull();
  rerender(player([], true));
  expect(
    screen.getByRole("button", { name: "Check for uploads" }),
  ).toBeDefined();
  expect(screen.getByRole("button", { name: "End Slideshow" })).toBeDefined();
});

it("retains the numeric position through reordered uploads and preserves pause across an empty refresh", () => {
  const { rerender } = render(player());
  fireEvent.click(screen.getByRole("button", { name: /Next/ }));
  fireEvent.click(screen.getByRole("button", { name: /Pause/ }));
  rerender(player([image("inserted"), ...images]));
  expect(screen.getByLabelText("Slide counter").textContent).toBe("2 / 4");
  expect(screen.getByAltText("Chaos Crawl upload").getAttribute("src")).toBe(
    "first.jpg",
  );
  rerender(player([]));
  expect(screen.getByText("Waiting for chaos...")).toBeDefined();
  rerender(player());
  expect(screen.getByLabelText("Slide counter").textContent).toBe("1 / 3");
  expect(screen.getByText("PAUSED")).toBeDefined();
  act(() => vi.advanceTimersByTime(10000));
  expect(screen.getByLabelText("Slide counter").textContent).toBe("1 / 3");
});

it("recovers a failed upload when the same id receives a replacement URL and type", () => {
  const { container, rerender } = render(player([video, images[0]]));
  const element = container.querySelector("video");
  if (!element) throw new Error("Expected original video upload");
  fireEvent.error(element);
  expect(
    screen.getByRole("heading", { name: "Could not load this upload" }),
  ).toBeDefined();
  const replacement: Media = {
    ...video,
    media_type: "image",
    image_url: "replacement.jpg",
  };
  rerender(player([replacement, images[0]]));
  expect(screen.getByAltText("Chaos Crawl upload").getAttribute("src")).toBe(
    "replacement.jpg",
  );
  expect(screen.queryByText("Could not load this upload")).toBeNull();
  expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
});

it("ignores an obsolete playback rejection after its upload identity is removed", async () => {
  let reject: (error: Error) => void = () => {
    throw new Error("Playback request not initialized");
  };
  const pending = new Promise<void>((_resolve, fail) => {
    reject = fail;
  });
  vi.mocked(HTMLMediaElement.prototype.play).mockReturnValueOnce(pending);
  const { rerender } = render(player([video, images[0]]));
  rerender(player([images[0]]));
  await act(async () => reject(new Error("Obsolete playback failure")));
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.getByAltText("Chaos Crawl upload").getAttribute("src")).toBe(
    "first.jpg",
  );
});

it("keeps native empty refresh usable while a pending end action disables only its command", () => {
  const reload = vi.fn().mockResolvedValue(undefined),
    end = vi.fn();
  render(
    <SlideshowPlayer media={[]} isHost ending end={end} reload={reload} />,
  );
  expect(
    screen.getByRole("button", { name: "Ending..." }).hasAttribute("disabled"),
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Check for uploads" }));
  expect(reload).toHaveBeenCalledOnce();
  expect(end).not.toHaveBeenCalled();
});

it("clears blocked-play feedback only when native playback actually begins", async () => {
  vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(
    new Error("autoplay blocked"),
  );
  const { container } = render(player([video, images[0]]));
  await act(async () => {});
  expect(screen.getByRole("status").textContent).toContain("video controls");
  const element = container.querySelector("video");
  if (!element) throw new Error("Expected blocked native video");
  fireEvent.play(element);
  expect(screen.getByRole("status")).toBeDefined();
  fireEvent.playing(element);
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.getByLabelText("Slide counter").textContent).toBe("1 / 2");
});
