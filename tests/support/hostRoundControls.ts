import type { installSessionBackend } from "./sessionBackend";

type Backend = Awaited<ReturnType<typeof installSessionBackend>>;
export function seedHostRoundControls(
  backend: Backend,
  {
    autoplay = false,
    breakMinutes = 0,
    onBreak = false,
    completed = false,
    currentRound = 1,
  }: {
    autoplay?: boolean;
    breakMinutes?: number;
    onBreak?: boolean;
    completed?: boolean;
    currentRound?: number;
  } = {},
) {
  backend.session.round_count = 2;
  backend.session.current_round_number = currentRound;
  backend.session.status = completed ? "completed" : "live";
  backend.challenges.push({
    ...backend.challenges[0],
    id: "round-2",
    title: "Second entrance",
    description: "Follow the next challenge.",
    points: 40,
    round_number: 2,
    sort_order: 3,
  });
  backend.rows.host_games = [
    { id: "test-plan", plan_data: { autoplay, breakMinutes } },
  ];
  backend.timer.round_number = currentRound;
  if (onBreak) {
    backend.timer.is_on_break = true;
    backend.timer.is_running = true;
    backend.timer.remaining_seconds = 60;
    backend.rows.cc_game_session_timers = [
      { ...backend.timer, resume_round_number: 2 },
    ];
  }
}
