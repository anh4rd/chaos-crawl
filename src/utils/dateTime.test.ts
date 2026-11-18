import { expect, it } from "vitest";
import { timePlus } from "./dateTime";
it.each(["", "bad", "25:00", "18:70", "18:"])(
  "uses the existing missing-time copy for invalid input %j",
  (value) => {
    expect(timePlus(value, 5)).toBe("Time TBC");
  },
);
it.each([
  ["18:00", 5, "18:05"],
  ["23:55", 10, "00:05"],
  ["00:05", -10, "23:55"],
  ["18:00", 1440, "18:00"],
  ["06:30", 0, "06:30"],
] as const)(
  "keeps valid %s plus %s minutes as %s",
  (time, minutes, expected) => {
    expect(timePlus(time, minutes)).toBe(expected);
  },
);

it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
  "uses missing-time copy for non-finite minute offset %s",
  (minutes) => {
    expect(timePlus("18:00", minutes)).toBe("Time TBC");
  },
);
it("keeps unrepresentable minute offsets out of the rendered clock", () => {
  expect(timePlus("18:00", Number.MAX_VALUE)).toBe("Time TBC");
});
