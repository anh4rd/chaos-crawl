export type {
  TaskKind,
  RewardMode,
  Task,
  ScheduleItem,
  Favourite,
  SetupForm,
} from "../../types/hostPlanning";
export type BuilderTab =
  | "players"
  | "main"
  | "side"
  | "secret"
  | "venue"
  | "controls"
  | "schedule"
  | "review"
  | "invites"
  | "launch";

export type UpdatePlan = <
  K extends keyof import("../../types/hostPlanning").SetupForm,
>(
  key: K,
  value: import("../../types/hostPlanning").SetupForm[K],
) => void;
