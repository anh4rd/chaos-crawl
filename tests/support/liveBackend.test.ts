import { expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";
import { withLiveBackend } from "./liveBackend";

const runId = "12345678-1234-1234-1234-123456789abc";
const flags = {
  voting_open: true,
  show_vote_results: false,
  slideshow_open: true,
};
const ok = { data: null, error: null };
function backend(responses: unknown[]) {
  const queries: ReturnType<typeof query>[] = [];
  function query(response: unknown) {
    const builder = {
      select: vi.fn(),
      eq: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      like: vi.fn(),
      single: vi.fn(async () => response),
      then: (
        resolve: (value: unknown) => unknown,
        reject?: (reason: unknown) => unknown,
      ) => Promise.resolve(response).then(resolve, reject),
    };
    for (const method of ["select", "eq", "update", "delete", "like"] as const)
      builder[method].mockReturnValue(builder);
    return builder;
  }
  const from = vi.fn(() => {
    const q = query(responses.shift());
    queries.push(q);
    return q;
  });
  return {
    client: { from } as unknown as SupabaseClient<Database>,
    from,
    queries,
  };
}
function fixture(...rest: unknown[]) {
  return backend([{ data: flags, error: null }, ...rest]);
}

it("seeds stable flags and cleans only UUID-owned players before restoring the snapshot", async () => {
  const db = fixture(ok, ok, ok);
  await withLiveBackend(db.client, runId, async () => {
    expect(db.queries[1].update).toHaveBeenCalledWith({
      voting_open: false,
      show_vote_results: false,
      slideshow_open: false,
    });
    expect(db.queries).toHaveLength(2);
  });
  expect(db.from.mock.calls).toHaveLength(4);
  expect(db.queries[2].delete).toHaveBeenCalledOnce();
  expect(db.queries[2].like).toHaveBeenCalledWith("name", `PW-TEST-${runId}-%`);
  expect(db.queries[3].update).toHaveBeenCalledWith(flags);
});
it("still restores flags and removes run-owned rows after the journey fails", async () => {
  const db = fixture(ok, ok, ok);
  const failure = new Error("journey failed");
  await expect(
    withLiveBackend(db.client, runId, async () => {
      throw failure;
    }),
  ).rejects.toBe(failure);
  expect(db.queries[2].like).toHaveBeenCalledWith("name", `PW-TEST-${runId}-%`);
  expect(db.queries[3].update).toHaveBeenCalledWith(flags);
});
it("attempts restoration even when cleanup fails and preserves both failures", async () => {
  const db = fixture(
    ok,
    { data: null, error: { message: "delete denied" } },
    ok,
  );
  const failure = new Error("journey failed");
  const error = await withLiveBackend(db.client, runId, async () => {
    throw failure;
  }).catch((error) => error);
  expect(error).toBeInstanceOf(AggregateError);
  expect(error.errors[0]).toBe(failure);
  expect(error.errors[1].message).toContain("delete denied");
  expect(db.queries[3].update).toHaveBeenCalledWith(flags);
});
it("does not mutate or run a journey when the original flags cannot be snapshotted", async () => {
  const db = backend([{ data: null, error: { message: "row missing" } }]);
  const run = vi.fn();
  await expect(withLiveBackend(db.client, runId, run)).rejects.toThrow(
    "row missing",
  );
  expect(db.from).toHaveBeenCalledOnce();
  expect(run).not.toHaveBeenCalled();
  expect(db.queries[0].update).not.toHaveBeenCalled();
});
it("rejects wildcard-shaped run identifiers before accessing any backend", async () => {
  const db = backend([]);
  const run = vi.fn();
  await expect(withLiveBackend(db.client, "%", run)).rejects.toThrow("UUID");
  expect(db.from).not.toHaveBeenCalled();
  expect(run).not.toHaveBeenCalled();
});
it("cleans and restores after seed failure without executing the journey", async () => {
  const db = fixture({ data: null, error: { message: "seed denied" } }, ok, ok);
  const run = vi.fn();
  await expect(withLiveBackend(db.client, runId, run)).rejects.toThrow(
    "seed denied",
  );
  expect(run).not.toHaveBeenCalled();
  expect(db.queries[3].update).toHaveBeenCalledWith(flags);
});
it("fails a successful journey when its state cannot be restored", async () => {
  const db = fixture(ok, ok, {
    data: null,
    error: { message: "restore denied" },
  });
  await expect(
    withLiveBackend(db.client, runId, async () => {}),
  ).rejects.toThrow("restore denied");
  expect(db.queries[2].like).toHaveBeenCalledWith("name", `PW-TEST-${runId}-%`);
});
