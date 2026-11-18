import { beforeEach, expect, it, vi } from "vitest";
import {
  readFinalSlideshow,
  readSecretSlideshow,
} from "./sessionSlideshowQueries";

const backend = vi.hoisted(() => ({ rpc: vi.fn(), reportError: vi.fn() }));
vi.mock("./sessionSupabase", () => ({ supabase: { rpc: backend.rpc } }));
vi.mock("./monitoring", () => ({ reportError: backend.reportError }));

beforeEach(() => backend.rpc.mockReset());
for (const { read, rpc } of [
  { read: readFinalSlideshow, rpc: "cc_get_session_final_slideshow" },
  { read: readSecretSlideshow, rpc: "cc_get_session_secret_review_slideshow" },
]) {
  it(`${rpc} preserves the public session-only read contract`, async () => {
    const data = {
      open: false,
      challenge_id: null,
      assignment_id: null,
      mission: null,
      evidence_id: null,
      items: [],
    };
    backend.rpc.mockResolvedValue({ data, error: null });
    expect(await read("session-a")).toEqual({ data, error: null });
    expect(backend.rpc).toHaveBeenCalledExactlyOnceWith(rpc, {
      p_session_id: "session-a",
    });
  });
  it(`${rpc} accepts a not-yet-published null state`, async () => {
    backend.rpc.mockResolvedValue({ data: null, error: null });
    expect(await read("session-a")).toEqual({ data: null, error: null });
    expect(backend.reportError).not.toHaveBeenCalled();
  });
  it(`${rpc} preserves database error code/message without exposing errored data`, async () => {
    const error = { code: "READ_DENIED", message: "The view is unavailable." };
    backend.rpc.mockResolvedValue({ data: { open: true }, error });
    expect(await read("session-a")).toEqual({ data: null, error });
    expect(backend.reportError).toHaveBeenCalledWith(error, "api");
  });
  it(`${rpc} normalizes a thrown transport failure and permits a subsequent read`, async () => {
    backend.rpc.mockRejectedValueOnce(new Error("Transport unavailable"));
    backend.rpc.mockResolvedValue({ data: null, error: null });
    expect(await read("session-a")).toEqual({
      data: null,
      error: { message: "Transport unavailable" },
    });
    expect(await read("session-a")).toEqual({ data: null, error: null });
    expect(backend.rpc).toHaveBeenCalledTimes(2);
  });
}
