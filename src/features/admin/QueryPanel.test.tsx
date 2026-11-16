import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import QueryPanel from "./QueryPanel";
afterEach(cleanup);

it("does not expose empty content or writes while any first query is pending", () => {
  const query = {
    loading: true,
    error: null as Error | null,
    reload: vi.fn().mockResolvedValue(undefined),
  };
  const view = render(
    <QueryPanel queries={[query]} loadingText="Loading records...">
      <button>Write</button>
      <p>No records</p>
    </QueryPanel>,
  );
  expect(screen.getByText("Loading records...")).toBeTruthy();
  expect(screen.queryByText("No records")).toBeNull();
  expect(screen.queryByRole("button", { name: "Write" })).toBeNull();
  query.loading = false;
  view.rerender(
    <QueryPanel queries={[query]} loadingText="Loading records...">
      <button>Write</button>
      <p>No records</p>
    </QueryPanel>,
  );
  expect(screen.getByRole("button", { name: "Write" })).toBeTruthy();
});
it("keeps a successful snapshot and gives each failed refresh its own retry", () => {
  const first = {
    loading: false,
    error: null as Error | null,
    reload: vi.fn().mockResolvedValue(undefined),
  };
  const second = { ...first, reload: vi.fn().mockResolvedValue(undefined) };
  const view = render(
    <QueryPanel queries={[first, second]} loadingText="Loading...">
      <p>Saved snapshot</p>
    </QueryPanel>,
  );
  first.loading = true;
  view.rerender(
    <QueryPanel queries={[first, second]} loadingText="Loading...">
      <p>Saved snapshot</p>
    </QueryPanel>,
  );
  expect(screen.getByText("Saved snapshot")).toBeTruthy();
  first.loading = false;
  first.error = new Error("Players failed");
  second.error = new Error("Teams failed");
  view.rerender(
    <QueryPanel queries={[first, second]} loadingText="Loading...">
      <p>Saved snapshot</p>
    </QueryPanel>,
  );
  expect(screen.getByText("Saved snapshot")).toBeTruthy();
  const retries = screen.getAllByRole("button", { name: "Try again" });
  fireEvent.click(retries[1]);
  expect(second.reload).toHaveBeenCalledOnce();
  expect(first.reload).not.toHaveBeenCalled();
});
