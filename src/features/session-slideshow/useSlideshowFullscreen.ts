import { useEffect, useRef } from "react";

export function useSlideshowFullscreen(onError: (message: string) => void) {
  const mounted = useRef(false);
  const generation = useRef(0);
  useEffect(() => {
    mounted.current = true;
    generation.current += 1;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function enterFullscreen() {
    if (!mounted.current) return;
    const version = generation.current;
    try {
      await document.documentElement.requestFullscreen();
    } catch (error) {
      if (!mounted.current || generation.current !== version) return;
      onError(
        error instanceof Error
          ? `Couldn't enter fullscreen: ${error.message}`
          : "Couldn't enter fullscreen.",
      );
    }
  }
  return enterFullscreen;
}
