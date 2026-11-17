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
  const element = container.querySelector("video")!;
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
  fireEvent.error(container.querySelector("video")!);
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
