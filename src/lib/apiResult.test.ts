import { beforeEach, expect, it, vi } from "vitest";
import { runApi } from "./apiResult";
const { reportError } = vi.hoisted(() => ({ reportError: vi.fn() }));
vi.mock("./monitoring", () => ({ reportError }));
beforeEach(() => {
  vi.clearAllMocks();
});
it.each(["returned", "rejected"])(
  "normalizes a %s boundary failure and reports its original cause once",
  async (mode) => {
    const cause = { message: "Unavailable", code: "NETWORK" };
    const result = await runApi(() =>
      mode === "returned"
        ? Promise.resolve({ data: null, error: cause })
        : Promise.reject(cause),
    );
    expect(result).toEqual({
      data: null,
      error: { message: "Unavailable", code: "NETWORK" },
    });
    expect(reportError).toHaveBeenCalledTimes(1);
    expect(reportError).toHaveBeenCalledWith(cause, "api");
  },
);
it("keeps successful data and emits no failure report", async () => {
  const data = { id: "record" };
  expect(await runApi(async () => ({ data, error: null }))).toEqual({
    data,
    error: null,
  });
  expect(reportError).not.toHaveBeenCalled();
});
