import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import TimelineItem from "./TimelineItem";
import type { ScheduleItem } from "./types";
import { taskLibrary } from "./catalog";

afterEach(cleanup);
it.each([-1, 1] as const)(
  "moves a challenge past an adjacent break with the %s control",
  (direction) => {
    const challenge: ScheduleItem = {
      id: "challenge",
      type: "challenge",
      title: "Act",
      duration: 10,
      taskId: "act",
      phase: "prep",
    };
    const pause: ScheduleItem = {
      id: "break",
      type: "break",
      title: "Break",
      duration: 5,
    };
    const schedule = direction === -1 ? [pause, challenge] : [challenge, pause];
    const onReorder = vi.fn();
    render(
      <TimelineItem
        item={challenge}
        index={schedule.indexOf(challenge)}
        schedule={schedule}
        startTime="18:00"
        allTasks={[]}
        showEmojiPicker={false}
        onUploadIcon={vi.fn()}
        onClearIcon={vi.fn()}
        onSelectEmoji={vi.fn()}
        dragged={null}
        setDragged={vi.fn()}
        onReorder={onReorder}
        onPatch={vi.fn()}
        onDelete={vi.fn()}
        onChangeType={vi.fn()}
        onChangeUnlinkedType={vi.fn()}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: `Move Act ${direction === -1 ? "up" : "down"}`,
      }),
    );
    expect(onReorder).toHaveBeenCalledWith(
      direction === -1 ? [challenge, pause] : [pause, challenge],
    );
  },
);

it("lets hosts select a different OpenMoji for a scheduled challenge", () => {
  const task = taskLibrary.find((candidate) => candidate.id === "pineapple");
  if (!task) throw new Error("The pineapple challenge fixture is missing.");
  const challenge: ScheduleItem = {
    id: "pineapple",
    type: "challenge",
    title: task.title,
    duration: 20,
    taskId: task.id,
  };
  const onSelectEmoji = vi.fn();
  render(
    <TimelineItem
      item={challenge}
      index={0}
      schedule={[challenge]}
      startTime="18:00"
      allTasks={[task]}
      showEmojiPicker
      onUploadIcon={vi.fn()}
      onClearIcon={vi.fn()}
      onSelectEmoji={onSelectEmoji}
      dragged={null}
      setDragged={vi.fn()}
      onReorder={vi.fn()}
      onPatch={vi.fn()}
      onDelete={vi.fn()}
      onChangeType={vi.fn()}
      onChangeUnlinkedType={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByText("Change emoji"));
  fireEvent.change(
    screen.getByRole("searchbox", {
      name: "Search OpenMoji for Conceal a pineapple",
    }),
    { target: { value: "camera" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "Select camera emoji" }));
  expect(onSelectEmoji).toHaveBeenCalledWith("pineapple", "1F4F7");
});
