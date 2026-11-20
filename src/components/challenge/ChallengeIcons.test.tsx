import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import ChallengeIcons from "./ChallengeIcons";

afterEach(cleanup);

it("uses selected challenge artwork when supplied", () => {
  const { container } = render(
    <ChallengeIcons
      tasks={[
        {
          id: "entrance",
          title: "Make an entrance",
          artUrl: "https://assets.test/entrance.png",
        },
      ]}
    />,
  );
  expect(
    container.querySelector(".challenge-icons img")?.getAttribute("src"),
  ).toBe("https://assets.test/entrance.png");
});

it("automatically matches OpenMoji artwork to challenge words", () => {
  const { container } = render(
    <ChallengeIcons
      tasks={[
        {
          id: "pineapple",
          title: "Conceal a pineapple",
          description: "Hide a pineapple somewhere on your person.",
        },
      ]}
    />,
  );
  expect(
    container.querySelector(".challenge-icons img")?.getAttribute("src"),
  ).toContain("/openmoji/1F34D.svg");
});
