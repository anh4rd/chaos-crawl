import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import ScheduledCountdown from "./ScheduledCountdown";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it("counts down to zero without a database update or negative seconds", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  render(<ScheduledCountdown targetTime="2026-01-01T00:01:02Z" />);
  expect(screen.getByText("01:02")).toBeTruthy();
  act(() => vi.advanceTimersByTime(3000));
  expect(screen.getByText("00:59")).toBeTruthy();
  act(() => vi.advanceTimersByTime(120000));
  expect(screen.getByText("00:00")).toBeTruthy();
});
it("reschedules a changed deadline and clears its interval when unmounted", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  const { rerender, unmount } = render(
    <ScheduledCountdown targetTime="2026-01-01T00:00:01Z" />,
  );
  rerender(<ScheduledCountdown targetTime="2026-01-01T01:01:02Z" />);
  expect(screen.getByText("01:01:02")).toBeTruthy();
  expect(vi.getTimerCount()).toBe(1);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
it("handles missing and malformed targets without rendering NaN", () => {
  const { rerender, container } = render(
    <ScheduledCountdown targetTime={null} />,
  );
  expect(container.textContent).toBe("");
  rerender(<ScheduledCountdown targetTime="invalid" />);
  expect(screen.getByText("00:00")).toBeTruthy();
});
