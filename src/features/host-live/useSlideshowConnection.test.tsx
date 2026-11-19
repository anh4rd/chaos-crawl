import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useSlideshowConnection } from "./useSlideshowConnection";

const props = {
  url: "http://localhost/#/final-slideshow/session",
  setError: vi.fn(),
  setNotice: vi.fn(),
};
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
it("removes the state listener and closes the connection on unmount", async () => {
  const connection = {
    state: "connected",
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  class Request {
    start() {
      return Promise.resolve(connection);
    }
  }
  vi.stubGlobal("PresentationRequest", Request);
  const { result, unmount } = renderHook(() => useSlideshowConnection(props));
  await act(async () => {
    await result.current.cast();
  });
  expect(result.current.connected).toBe(true);
  unmount();
  expect(connection.close).toHaveBeenCalledOnce();
  expect(connection.removeEventListener).toHaveBeenCalledWith(
    "statechange",
    connection.addEventListener.mock.calls[0]?.[1],
  );
});
it("closes a late connection after navigation instead of attaching it to another session", async () => {
  const connection = {
    state: "connected",
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  let finish: (value: typeof connection) => void = () => {};
  class Request {
    start() {
      return new Promise<typeof connection>((resolve) => {
        finish = resolve;
      });
    }
  }
  vi.stubGlobal("PresentationRequest", Request);
  const { result, rerender } = renderHook(
    ({ url }) => useSlideshowConnection({ ...props, url }),
    { initialProps: { url: props.url } },
  );
  let pending: Promise<void> = Promise.resolve();
  act(() => {
    pending = result.current.cast();
  });
  rerender({ url: "http://localhost/#/final-slideshow/other" });
  await act(async () => {
    finish(connection);
    await pending;
  });
  expect(connection.close).toHaveBeenCalledOnce();
  expect(connection.addEventListener).not.toHaveBeenCalled();
  expect(result.current.connected).toBe(false);
});
it("retains the unsupported-browser recovery message", async () => {
  vi.stubGlobal("PresentationRequest", undefined);
  const { result } = renderHook(() => useSlideshowConnection(props));
  await act(async () => {
    await result.current.cast();
  });
  expect(props.setError).toHaveBeenCalledWith(
    expect.stringContaining("Chrome's Cast tab"),
  );
});
