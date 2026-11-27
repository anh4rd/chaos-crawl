import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { usePlanCatalogue } from "./usePlanCatalogue";
import type { CommunitySubmission } from "../../types/hostExplore";

const read = vi.hoisted(() => vi.fn());
vi.mock("../../lib/hostPlanApi", () => ({
  readApprovedPlanningChallenges: read,
}));
afterEach(() => {
  cleanup();
  read.mockReset();
});

it("includes Explore challenges and only approved community challenges", async () => {
  const submission: CommunitySubmission = {
    id: "approved",
    item_type: "challenge",
    title: "Community mission",
    description: "An approved idea",
    payload: { kind: "secret", points: 12, minutes: 8 },
    status: "approved",
    submitted_by: "host",
    review_note: null,
    created_at: "2030-01-01",
  };
  read.mockResolvedValue({
    data: [
      submission,
      { ...submission, id: "pending", status: "pending" },
      { ...submission, id: "rejected", status: "rejected" },
      { ...submission, id: "venue", item_type: "venue" },
    ],
    error: null,
  });
  const { result } = renderHook(() => usePlanCatalogue());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.tasks).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: "catalog:task-best-thing", kind: "main" }),
      expect.objectContaining({ id: "catalog:task-handshake", kind: "side" }),
      expect.objectContaining({
        id: "catalog:task-secret-mission",
        kind: "secret",
      }),
      expect.objectContaining({
        id: "catalog:community-approved",
        kind: "secret",
        points: 12,
      }),
    ]),
  );
  expect(
    result.current.tasks.some((task) => /pending|rejected|venue/.test(task.id)),
  ).toBe(false);
});

it("offers retry after failure and ignores a replaced read", async () => {
  let resolveOld: (result: {
    data: CommunitySubmission[];
    error: null;
  }) => void = () => {};
  read
    .mockReturnValueOnce(
      new Promise((resolve) => {
        resolveOld = resolve;
      }),
    )
    .mockResolvedValueOnce({ data: null, error: { message: "Offline" } })
    .mockResolvedValueOnce({ data: [], error: null });
  const { result } = renderHook(() => usePlanCatalogue());
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.error).toBe("Offline"));
  await act(async () => resolveOld({ data: [], error: null }));
  expect(result.current.error).toBe("Offline");
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error).toBe("");
  expect(read).toHaveBeenCalledTimes(3);
});
