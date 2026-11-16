import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";

const mocks = vi.hoisted(() => ({
  createPlayer: vi.fn(),
  setPlayerId: vi.fn(),
  awardScore: vi.fn(),
  from: vi.fn(),
  reload: vi.fn(),
  players: {
    data: [{ id: "p", name: "Anna", team: "Ducks", score: 0 }],
    loading: false,
    error: null as Error | null,
  },
}));
vi.mock("../lib/playerApi", () => ({ createPlayer: mocks.createPlayer }));
vi.mock("../lib/playerSession", () => ({ setPlayerId: mocks.setPlayerId }));
vi.mock("../lib/scoreApi", () => ({ awardScore: mocks.awardScore }));
vi.mock("../lib/supabase", () => ({ supabase: { from: mocks.from } }));
vi.mock("../game/hooks/usePlayers", () => ({
  usePlayers: () => ({ ...mocks.players, reload: mocks.reload }),
}));
import Join from "./Join";
import ChallengeReview from "./ChallengeReview";

function Location() {
  const location = useLocation();
  return <output aria-label="Location">{location.pathname}</output>;
}
function NextChallenge() {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate("/review?type=side&id=2&title=Next")}>
      Next challenge
    </button>
  );
}
function joinPage() {
  render(
    <MemoryRouter>
      <Join />
      <Location />
    </MemoryRouter>,
  );
}
function reviewPage(path = "/review?type=main&id=1&title=First") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ChallengeReview />
      <NextChallenge />
    </MemoryRouter>,
  );
}
function query(response: unknown | Promise<unknown>) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    in: vi.fn(),
    abortSignal: vi.fn(),
    then: (
      resolve: (value: unknown) => unknown,
      reject: (error: unknown) => unknown,
    ) => Promise.resolve(response).then(resolve, reject),
  };
  for (const method of ["select", "eq", "order", "in", "abortSignal"] as const)
    builder[method].mockReturnValue(builder);
  mocks.from.mockReturnValueOnce(builder);
  return builder;
}
const completion = {
  id: "c",
  player_id: "p",
  challenge_type: "main",
  challenge_id: "1",
  photo_id: null,
  completed_at: null,
  points: 5,
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.players.loading = false;
  mocks.players.error = null;
  mocks.createPlayer.mockResolvedValue({ data: { id: "p" }, error: null });
  mocks.awardScore.mockResolvedValue({ data: { id: "award" }, error: null });
});
afterEach(cleanup);

it("joins through an accessible form with a trimmed name and unassigned team", async () => {
  joinPage();
  fireEvent.change(screen.getByRole("textbox", { name: "Your name" }), {
    target: { value: " Anna " },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Join Game" }).closest("form")!,
  );
  await waitFor(() =>
    expect(mocks.createPlayer).toHaveBeenCalledWith("Anna", null),
  );
  await waitFor(() => expect(mocks.setPlayerId).toHaveBeenCalledWith("p"));
  expect(screen.getByLabelText("Location").textContent).toBe("/game");
});
it("shows validation and permits retry after a thrown join failure", async () => {
  mocks.createPlayer.mockRejectedValueOnce(new Error("Network offline"));
  joinPage();
  fireEvent.click(screen.getByRole("button", { name: "Join Game" }));
  expect(screen.getByRole("alert").textContent).toBe("Enter your name first.");
  expect(mocks.createPlayer).not.toHaveBeenCalled();
  fireEvent.change(screen.getByRole("textbox", { name: "Your name" }), {
    target: { value: "Anna" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await screen.findByText("Network offline");
  expect(
    (screen.getByRole("button", { name: "Try again" }) as HTMLButtonElement)
      .disabled,
  ).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await waitFor(() => expect(mocks.setPlayerId).toHaveBeenCalledWith("p"));
});
it("does not duplicate a created player when retrying failed local session storage", async () => {
  mocks.setPlayerId.mockImplementationOnce(() => {
    throw new Error("Storage blocked");
  });
  joinPage();
  fireEvent.change(screen.getByRole("textbox", { name: "Your name" }), {
    target: { value: "Anna" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Join Game" }));
  await screen.findByText("Storage blocked");
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await waitFor(() => expect(mocks.setPlayerId).toHaveBeenCalledTimes(2));
  expect(mocks.createPlayer).toHaveBeenCalledOnce();
});
it("keeps joining pending and prevents duplicate submissions", async () => {
  let resolve!: (value: unknown) => void;
  mocks.createPlayer.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  joinPage();
  fireEvent.change(screen.getByRole("textbox", { name: "Your name" }), {
    target: { value: "Anna" },
  });
  const form = screen
    .getByRole("button", { name: "Join Game" })
    .closest("form")!;
  fireEvent.submit(form);
  fireEvent.submit(form);
  expect(mocks.createPlayer).toHaveBeenCalledOnce();
  expect(
    (screen.getByRole("button", { name: "Joining..." }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  await act(async () => resolve({ data: { id: "p" }, error: null }));
});

it("rejects unsupported review types before querying the database", () => {
  reviewPage("/review?type=manual&id=1");
  expect(
    screen.getByRole("heading", { name: "Challenge not found" }),
  ).toBeTruthy();
  expect(mocks.from).not.toHaveBeenCalled();
});
it("shows review failure rather than empty success and retries", async () => {
  query({ data: null, error: { message: "Review offline" } });
  query({ data: [completion], error: null });
  reviewPage();
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Review offline",
  );
  expect(
    screen.queryByText("Nobody has completed this challenge yet."),
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Retry review" }));
  await screen.findByRole("heading", { name: "Anna" });
  expect(mocks.reload).toHaveBeenCalledOnce();
});
it("reports submission media failure without pretending a completion has no media", async () => {
  query({ data: [{ ...completion, photo_id: "photo" }], error: null });
  query({ data: null, error: { message: "Media unavailable" } });
  reviewPage();
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Media unavailable",
  );
  expect(screen.queryByText("Completed without media.")).toBeNull();
});
it("ignores a previous challenge response after navigation", async () => {
  let resolve!: (value: unknown) => void;
  query(
    new Promise((done) => {
      resolve = done;
    }),
  );
  query({ data: [], error: null });
  reviewPage();
  await waitFor(() => expect(mocks.from).toHaveBeenCalledOnce());
  fireEvent.click(screen.getByRole("button", { name: "Next challenge" }));
  await screen.findByText("Nobody has completed this challenge yet.");
  await act(async () => resolve({ data: [completion], error: null }));
  expect(screen.queryByRole("heading", { name: "Anna" })).toBeNull();
  expect(screen.getByRole("heading", { name: "Next" })).toBeTruthy();
});
it("displays player query errors with a retry", async () => {
  mocks.players.error = new Error("Players offline");
  query({ data: [completion], error: null });
  reviewPage();
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Players offline",
  );
  expect(screen.getByRole("button", { name: "Retry review" })).toBeTruthy();
});
it("recovers from a thrown award failure and honors explicit team selection", async () => {
  query({ data: [completion], error: null });
  mocks.awardScore.mockRejectedValueOnce(new Error("Award offline"));
  reviewPage();
  const points = await screen.findByRole("spinbutton", {
    name: "Points to award to Anna",
  });
  fireEvent.change(points, { target: { value: "10" } });
  fireEvent.change(screen.getByRole("combobox", { name: "Award to" }), {
    target: { value: "team" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Award Points" }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Award offline",
  );
  expect(
    (screen.getByRole("button", { name: "Award Points" }) as HTMLButtonElement)
      .disabled,
  ).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Award Points" }));
  expect((await screen.findByRole("status")).textContent).toContain(
    "Awarded 10 points",
  );
  expect(mocks.awardScore).toHaveBeenLastCalledWith(
    expect.objectContaining({
      playerId: null,
      teamName: "Ducks",
      challengeType: "main",
      points: 10,
    }),
  );
});

it("aborts the previous review before a late completion response can request media", async () => {
  let resolve!: (value: unknown) => void;
  const previous = query(
    new Promise((done) => {
      resolve = done;
    }),
  );
  query({ data: [], error: null });
  reviewPage();
  await waitFor(() => expect(mocks.from).toHaveBeenCalledOnce());
  const signal = previous.abortSignal.mock.calls[0][0] as AbortSignal;
  fireEvent.click(screen.getByRole("button", { name: "Next challenge" }));
  await screen.findByText("Nobody has completed this challenge yet.");
  expect(signal.aborted).toBe(true);
  await act(async () =>
    resolve({ data: [{ ...completion, photo_id: "old-media" }], error: null }),
  );
  expect(mocks.from).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole("heading", { name: "Anna" })).toBeNull();
});

it("fetches shared submission media once and matches it to every completion", async () => {
  query({
    data: [
      { ...completion, photo_id: "shared" },
      { ...completion, id: "c2", photo_id: "shared" },
    ],
    error: null,
  });
  const media = query({
    data: [
      {
        id: "shared",
        image_url: "https://example.invalid/shared.png",
        media_type: "image",
      },
    ],
    error: null,
  });
  reviewPage();
  const images = await screen.findAllByRole("img", {
    name: "Challenge submission",
  });
  expect(images).toHaveLength(2);
  expect(
    images.every(
      (image) =>
        image.getAttribute("src") === "https://example.invalid/shared.png",
    ),
  ).toBe(true);
  expect(media.in).toHaveBeenCalledWith("id", ["shared"]);
});

it("does not show a previous submission award outcome on the next challenge", async () => {
  query({ data: [completion], error: null });
  query({
    data: [
      { ...completion, id: "new", challenge_id: "2", challenge_type: "side" },
    ],
    error: null,
  });
  let resolve!: (value: unknown) => void;
  mocks.awardScore.mockReturnValueOnce(
    new Promise((done) => {
      resolve = done;
    }),
  );
  reviewPage();
  fireEvent.change(
    await screen.findByRole("spinbutton", { name: "Points to award to Anna" }),
    { target: { value: "5" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "Award Points" }));
  fireEvent.click(screen.getByRole("button", { name: "Next challenge" }));
  await screen.findByRole("spinbutton", { name: "Points to award to Anna" });
  await act(async () =>
    resolve({ data: null, error: { message: "Late award error" } }),
  );
  expect(screen.queryByRole("alert")).toBeNull();
  expect(
    (
      screen.getByRole("spinbutton", {
        name: "Points to award to Anna",
      }) as HTMLInputElement
    ).value,
  ).toBe("");
  expect(screen.getByRole("heading", { name: "Next" })).toBeTruthy();
});
