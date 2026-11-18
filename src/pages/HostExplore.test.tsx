import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import HostExplore from "./HostExplore";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  getUser: vi.fn(),
  navigate: vi.fn(),
  failSave: true,
}));
vi.mock("../lib/sessionSupabase", () => ({
  supabase: {
    from: mocks.from,
    rpc: mocks.rpc,
    auth: { getUser: mocks.getUser },
  },
}));
vi.mock("../lib/hostAuth", () => ({ readHostIdentity: mocks.getUser }));
vi.mock("../lib/monitoring", () => ({ reportError: vi.fn() }));
vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("../features/host-workspace/HostWorkspace", () => ({
  default: ({ children }: PropsWithChildren) => <main>{children}</main>,
}));

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.failSave = true;
  mocks.getUser.mockResolvedValue({
    data: { user: { id: "host" } },
    error: null,
  });
  mocks.rpc.mockResolvedValue({ data: false, error: null });
  mocks.from.mockImplementation(() => {
    const response = { data: [], error: null };
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      insert: vi.fn(() => {
        if (mocks.failSave) throw new Error("Save unavailable");
        return query;
      }),
      single: vi.fn(async () => ({
        data: {
          id: "favourite",
          item_type: "task",
          item_id: "task-best-thing",
          item_data: {},
        },
        error: null,
      })),
      then: (...args: Parameters<Promise<typeof response>["then"]>) =>
        Promise.resolve(response).then(...args),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockReturnValue(query);
    return query;
  });
});

it("releases a failed save and permits retry when the SDK builder throws", async () => {
  render(<HostExplore />);
  await waitFor(() =>
    expect(screen.queryByText("Checking your saved items…")).toBeNull(),
  );
  const save = screen.getByRole("button", {
    name: "Save Obtain the best thing",
  });
  fireEvent.click(save);
  expect((await screen.findByRole("alert")).textContent).toBe(
    "Save unavailable",
  );
  expect(save).toHaveProperty("disabled", false);
  mocks.failSave = false;
  fireEvent.click(save);
  await screen.findByRole("button", {
    name: "Unsave Obtain the best thing",
  });
  expect(screen.queryByRole("alert")).toBeNull();
});
