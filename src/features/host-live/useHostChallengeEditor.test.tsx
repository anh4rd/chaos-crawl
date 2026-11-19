import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { hostChallengeFixture, hostSessionFixture } from "./testFixtures";
import { useHostChallengeEditor } from "./useHostChallengeEditor";
const commands = vi.hoisted(() => ({
  saveBreakChallenge: vi.fn(),
  readHostPlan: vi.fn(),
  saveHostPlanTasks: vi.fn(),
}));
vi.mock("../../lib/hostSessionCommands", () => commands);
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  commands.saveBreakChallenge.mockResolvedValue({ data: null, error: null });
  commands.saveHostPlanTasks.mockResolvedValue({ data: null, error: null });
});
function options(): Parameters<typeof useHostChallengeEditor>[0] {
  return {
    nextBreakTask: { id: "task", equipment: ["Old"] },
    session: hostSessionFixture(),
    setBusy: vi.fn(() => true),
    setError: vi.fn(),
    setNotice: vi.fn(),
    setPlannedTasks: vi.fn(),
    load: vi.fn(async () => {}),
  };
}
async function save(props: ReturnType<typeof options>) {
  const hook = renderHook(() => useHostChallengeEditor(props));
  act(() =>
    hook.result.current.openBreakChallengeEditor(hostChallengeFixture()),
  );
  act(() => {
    hook.result.current.setEditChallengeTitle("  New title  ");
    hook.result.current.setEditChallengeEquipment("Hat, , Coat ");
    hook.result.current.setEditChallengePoints(0);
  });
  let pending: Promise<void> | undefined;
  const view = render(
    <form
      aria-label="Editor"
      onSubmit={(event) => {
        pending = hook.result.current.saveBreakChallengeEdit(event);
      }}
    />,
  );
  await act(async () => {
    fireEvent.submit(view.getByRole("form", { name: "Editor" }));
    await pending;
  });
  return hook;
}
it("preserves saved root metadata, unrelated task values/order and unknown task fields", async () => {
  const plan = {
    metadata: { retain: true },
    selectedTasks: [
      { id: "other", title: "Other", extra: [1, 2] },
      { id: "task", title: "Old", custom: { keep: "yes" } },
      { title: "No id", hidden: false },
    ],
  };
  commands.readHostPlan.mockResolvedValue({
    data: { plan_data: plan },
    error: null,
  });
  const props = options();
  await save(props);
  expect(commands.saveBreakChallenge).toHaveBeenCalledWith({
    values: {
      title: "New title",
      description: "Enter with style.",
      duration_minutes: 5,
      points: 0,
      allow_photo_upload: false,
    },
    challengeId: "challenge",
    sessionId: "session",
  });
  expect(commands.saveHostPlanTasks).toHaveBeenCalledWith({
    values: {
      plan_data: {
        metadata: plan.metadata,
        selectedTasks: [
          plan.selectedTasks[0],
          {
            ...plan.selectedTasks[1],
            title: "New title",
            description: "Enter with style.",
            minutes: 5,
            points: 0,
            equipment: ["Hat", "Coat"],
          },
          plan.selectedTasks[2],
        ],
      },
    },
    hostGameId: "plan",
    hostId: "host",
  });
  expect(commands.saveBreakChallenge.mock.invocationCallOrder[0]).toBeLessThan(
    commands.readHostPlan.mock.invocationCallOrder[0] ?? 0,
  );
  expect(props.load).toHaveBeenCalledOnce();
});
it.each([
  null,
  {},
  { selectedTasks: null },
  { selectedTasks: [null] },
  { selectedTasks: [{ id: "task", equipment: [42] }] },
])(
  "does not overwrite malformed saved data after a live edit: %j",
  async (plan) => {
    commands.readHostPlan.mockResolvedValue({
      data: { plan_data: plan },
      error: null,
    });
    const props = options();
    const { result } = await save(props);
    expect(commands.saveBreakChallenge).toHaveBeenCalledOnce();
    expect(commands.saveHostPlanTasks).not.toHaveBeenCalled();
    expect(props.setNotice).toHaveBeenLastCalledWith(
      "Challenge updated for this game. Its saved plan equipment could not be updated.",
    );
    expect(result.current.editingBreakChallenge).toBeNull();
    expect(props.load).toHaveBeenCalledOnce();
  },
);
it("does not overwrite a plan after a failed read", async () => {
  commands.readHostPlan.mockResolvedValue({
    data: null,
    error: { message: "Read failed" },
  });
  const props = options();
  await save(props);
  expect(commands.saveHostPlanTasks).not.toHaveBeenCalled();
  expect(props.setNotice).toHaveBeenLastCalledWith(
    "Challenge updated for this game. Its saved plan equipment could not be updated.",
  );
});
it("stops before a saved-plan read when the live update fails", async () => {
  commands.saveBreakChallenge.mockResolvedValue({
    data: null,
    error: { message: "Write failed" },
  });
  const props = options();
  await save(props);
  expect(commands.readHostPlan).not.toHaveBeenCalled();
  expect(props.setError).toHaveBeenLastCalledWith(
    "Couldn't update this challenge: Write failed",
  );
});
