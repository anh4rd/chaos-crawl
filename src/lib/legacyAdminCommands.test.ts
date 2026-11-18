import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ from: vi.fn(), insert: vi.fn() }));
vi.mock("./supabase", () => ({ supabase: { from: mocks.from } }));
import { createLegacyAdminTeam } from "./legacyAdminCommands";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.from.mockReturnValue({ insert: mocks.insert });
});
it("inserts only the supplied name and preserves the SDK result without a read", async () => {
  const result = { data: null, error: null };
  mocks.insert.mockResolvedValue(result);
  expect(await createLegacyAdminTeam("Ducks")).toBe(result);
  expect(mocks.from).toHaveBeenCalledExactlyOnceWith("teams");
  expect(mocks.insert).toHaveBeenCalledExactlyOnceWith({ name: "Ducks" });
});
it("retains database error identity and transport rejection for the existing controller feedback", async () => {
  const error = { message: "Team denied", code: "42501" };
  mocks.insert.mockResolvedValueOnce({ data: null, error });
  expect((await createLegacyAdminTeam("Ducks")).error).toBe(error);
  const failure = new Error("Offline");
  mocks.insert.mockRejectedValueOnce(failure);
  await expect(createLegacyAdminTeam("Geese")).rejects.toBe(failure);
});
