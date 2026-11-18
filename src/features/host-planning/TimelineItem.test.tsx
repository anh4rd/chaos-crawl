import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import TimelineItem from "./TimelineItem";
import type { ScheduleItem } from "./types";

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
        dragged={null}
        setDragged={vi.fn()}
        onReorder={onReorder}
        onPatch={vi.fn()}
        onDelete={vi.fn()}
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
