import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { useHostOperation } from "./useHostOperation";

afterEach(cleanup);
it("locks conflicting actions synchronously before React can rerender", () => {
  const { result } = renderHook(useHostOperation);
  act(() => {
    expect(result.current.setBusy(true)).toBe(true);
    expect(result.current.setBusy(true)).toBe(false);
  });
  expect(result.current.busy).toBe(true);
  act(() => {
    result.current.setBusy(false);
    expect(result.current.setBusy(true)).toBe(true);
  });
});
