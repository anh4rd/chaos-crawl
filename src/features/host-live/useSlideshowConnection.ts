import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  PresentationConnectionLike,
  PresentationRequestConstructor,
} from "./types";

export function useSlideshowConnection({
  url,
  available = true,
  secret = false,
  setError,
  setNotice,
}: {
  url: string | null;
  available?: boolean;
  secret?: boolean;
  setError: Dispatch<SetStateAction<string>>;
  setNotice: Dispatch<SetStateAction<string>>;
}) {
  const active = useRef<PresentationConnectionLike | null>(null);
  const removeListener = useRef<(() => void) | null>(null);
  const generation = useRef(0);
  const [connected, setConnected] = useState(false);
  const disconnect = useCallback(() => {
    removeListener.current?.();
    removeListener.current = null;
    active.current?.close();
    active.current = null;
    setConnected(false);
  }, []);
  useEffect(() => {
    setConnected(false);
    return () => {
      generation.current += 1;
      removeListener.current?.();
      removeListener.current = null;
      active.current?.close();
      active.current = null;
    };
  }, [url]);
  async function cast() {
    if (!url || !available || active.current) return;
    const Request = (
      window as Window & {
        PresentationRequest?: PresentationRequestConstructor;
      }
    ).PresentationRequest;
    if (!Request) {
      setError(
        "This browser can't open a TV device picker. Use Chrome's Cast tab option or AirPlay screen mirroring instead.",
      );
      return;
    }
    const version = generation.current;
    setError("");
    setNotice("");
    try {
      const connection = await new Request([url]).start();
      if (version !== generation.current) {
        connection.close();
        return;
      }
      active.current = connection;
      setConnected(connection.state === "connected");
      const changed = () => {
        if (active.current !== connection) return;
        const value = connection.state === "connected";
        setConnected(value);
        if (!value) {
          removeListener.current?.();
          removeListener.current = null;
          active.current = null;
        }
      };
      connection.addEventListener("statechange", changed);
      removeListener.current = () =>
        connection.removeEventListener("statechange", changed);
    } catch (error) {
      if (
        version !== generation.current ||
        (error instanceof DOMException && error.name === "AbortError")
      )
        return;
      const label = secret ? "secret mission slideshow" : "slideshow";
      setError(
        error instanceof Error
          ? `Couldn't cast the ${label}: ${error.message}`
          : `Couldn't cast the ${label}.`,
      );
    }
  }
  return { connected, cast, disconnect };
}
