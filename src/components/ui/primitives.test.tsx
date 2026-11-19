import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import Button from "./Button";
import Input from "./Input";

afterEach(cleanup);

it("supports compact buttons while preserving native disabled behavior", () => {
  const onClick = vi.fn();
  const { rerender } = render(
    <Button fullWidth={false} disabled onClick={onClick}>
      Save
    </Button>,
  );
  const button = screen.getByRole("button", { name: "Save" });
  expect(button.classList.contains("btn--block")).toBe(false);
  fireEvent.click(button);
  expect(onClick).not.toHaveBeenCalled();
  rerender(<Button onClick={onClick}>Save</Button>);
  expect(button.classList.contains("btn--block")).toBe(true);
  fireEvent.click(button);
  expect(onClick).toHaveBeenCalledOnce();
});

it("keeps input styling and caller classes with native input events", () => {
  const onChange = vi.fn();
  render(<Input aria-label="Name" className="mt-2" onChange={onChange} />);
  const input = screen.getByRole("textbox", { name: "Name" });
  expect(input.classList.contains("mt-2")).toBe(true);
  expect(input.classList.contains("input")).toBe(true);
  fireEvent.change(input, { target: { value: "Anna" } });
  expect(onChange).toHaveBeenCalledOnce();
});
