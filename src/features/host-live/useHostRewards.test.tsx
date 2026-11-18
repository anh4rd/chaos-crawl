import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { hostChallengeFixture, hostSessionFixture } from "./testFixtures";
import { useHostRewards } from "./useHostRewards";

vi.mock("../../lib/hostRewardCommands", () => ({}));
vi.mock("../../lib/sessionParticipantCommands", () => ({}));
afterEach(cleanup);
function options(): Parameters<typeof useHostRewards>[0] {
  return {
    rewardRounds: [],
    currentChallenge: hostChallengeFixture(),
    rewardVotes: [],
    rewardAwards: [],
    challenges: [hostChallengeFixture()],
    session: hostSessionFixture(),
    teams: [],
    players: [],
    setError: vi.fn(),
    setBusy: vi.fn(() => true),
    setNotice: vi.fn(),
    load: vi.fn(async () => {}),
    busy: false,
    setHostParticipation: vi.fn(async () => true),
  };
}
it("retains an explicit challenge selection across data refreshes", () => {
  const props = options();
  const { result, rerender } = renderHook(
    ({ value }) => useHostRewards(value),
    { initialProps: { value: props } },
  );
  expect(result.current.rewardChallengeId).toBe("challenge");
  act(() => result.current.setRewardChallengeId("chosen"));
  rerender({
    value: { ...props, challenges: [hostChallengeFixture({ id: "other" })] },
  });
  expect(result.current.rewardChallengeId).toBe("chosen");
});
it("preserves an enabled method and falls back when setup disables it", () => {
  const props = options();
  const { result, rerender } = renderHook(
    ({ value }) => useHostRewards(value),
    { initialProps: { value: props } },
  );
  act(() => result.current.setRewardMethod("host_awards"));
  rerender({ value: { ...props, challenges: [...props.challenges] } });
  expect(result.current.rewardMethod).toBe("host_awards");
  rerender({
    value: {
      ...props,
      session: hostSessionFixture({ reward_methods: ["voting"] }),
    },
  });
  expect(result.current.rewardMethod).toBe("voting");
});
