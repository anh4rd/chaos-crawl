import { useCallback, useEffect, useState } from "react";
import type { Media } from "../../types/database";

export function useSlideshowPlayback(media: Media[]) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const currentIndex = index < media.length ? index : 0;
  const current = media[currentIndex] ?? null;
  const next = useCallback(() => {
    setIndex((value) =>
      media.length
        ? ((value < media.length ? value : 0) + 1) % media.length
        : 0,
    );
  }, [media.length]);
  const previous = useCallback(() => {
    setIndex((value) =>
      media.length
        ? ((value < media.length ? value : 0) - 1 + media.length) % media.length
        : 0,
    );
  }, [media.length]);
  const togglePaused = useCallback(() => setPaused((value) => !value), []);

  useEffect(() => {
    if (index >= media.length) setIndex(0);
  }, [index, media.length]);

  const currentUrl = current?.image_url;
  const currentType = current?.media_type;
  useEffect(() => {
    if (paused || media.length <= 1 || !currentUrl || currentType === "video")
      return;
    const timer = window.setTimeout(next, 5000);
    return () => window.clearTimeout(timer);
  }, [paused, media.length, currentUrl, currentType, currentIndex, next]);

  const upcoming =
    media.length > 1 ? media[(currentIndex + 1) % media.length] : null;
  const upcomingUrl = upcoming?.image_url;
  const upcomingType = upcoming?.media_type;
  useEffect(() => {
    if (!upcomingUrl || upcomingType === "video") return;
    const image = new Image();
    image.src = upcomingUrl;
    return () => image.removeAttribute("src");
  }, [upcomingUrl, upcomingType]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (
        event.defaultPrevented ||
        (target instanceof HTMLElement &&
          (target.isContentEditable ||
            target.closest("input, textarea, select, button, video")))
      )
        return;
      if (!media.length) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        previous();
      }
      if (event.key === " ") {
        event.preventDefault();
        togglePaused();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [media.length, next, previous, togglePaused]);

  return { current, currentIndex, paused, next, previous, togglePaused };
}
