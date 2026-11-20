import { expect, it } from "vitest";
import {
  challengeArtwork,
  closestOpenMoji,
  closestOpenMojis,
  openMojiSelection,
  searchOpenMojis,
  selectedOpenMojiCode,
} from "./openmoji";

it("matches a challenge's specific words against OpenMoji annotations and tags", () => {
  expect(
    closestOpenMoji(
      "Conceal a pineapple",
      "Hide a pineapple somewhere on your person and get a photo or video.",
    ),
  ).toMatchObject({ hexcode: "1F34D", annotation: "pineapple" });
});

it("returns close alternatives and searches OpenMoji tags", () => {
  expect(
    closestOpenMojis("Invent a secret handshake").map((emoji) => emoji.hexcode),
  ).toContain("1F91D");
  expect(searchOpenMojis("pineapple").map((emoji) => emoji.hexcode)).toContain(
    "1F34D",
  );
});

it("round-trips an explicit emoji selection and renders its OpenMoji SVG", () => {
  const selection = openMojiSelection("1f34d");
  expect(selectedOpenMojiCode(selection)).toBe("1F34D");
  expect(challengeArtwork(selection, "A different challenge").src).toContain(
    "/1F34D.svg",
  );
});
