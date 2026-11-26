export type TaskKind = "main" | "side" | "secret";

export type RewardMode = "voting" | "host-awards" | "audience-cheers";

export type Task = {
  id: string;
  title: string;
  description: string;
  kind: TaskKind;
  minutes: number;
  points: number;
  prepMinutes?: number;
  performanceMinutes?: number;
  vibe: string[];
  accessibility: string[];
  equipment: string[];
  setup: string;
  prep: string;
  evidenceRequired: boolean;
  preGame?: boolean;
  instructions?: string;
  tags?: string[];
};

export type ScheduleItem = {
  id: string;
  type:
    | "welcome"
    | "teams"
    | "challenge"
    | "break"
    | "final"
    | "pregame"
    | "pregame-review"
    | "secret-reveal";
  title: string;
  duration: number;
  taskId?: string;
  phase?: "prep" | "performance";
  editable?: boolean;
};

export type Favourite = {
  id: string;
  item_type: "task" | "venue" | "route";
  item_id: string;
};

export interface SetupForm {
  name: string;
  eventDate: string;
  startTime: string;
  idealEndTime: string;
  playerCount: number;
  gamePhotoUrl: string;
  challengeArtUrls: Record<string, string>;
  hostParticipates: boolean;
  teamsEnabled: boolean;
  teamSize: number | null;
  teamSetup: "host" | "players" | "later";
  accessibility: string[];
  ageGroup: string;
  alcohol: string;
  venueName: string;
  venueAddress: string;
  venueNotes: string;
  selectedMain: string[];
  selectedSide: string[];
  selectedSecret: string[];
  customTasks: Task[];
  rewardModes: RewardMode[];
  decideRewardInGame: boolean;
  sideChallenges: boolean;
  secretMissions: boolean;
  slideshow: boolean;
  liveFinal: boolean;
  strictSchedule: boolean;
  challengeTimers: boolean;
  autoplay: boolean;
  whatsappReminders: boolean;
  autoAssignSecrets: boolean;
  secretAssignment: "auto" | "host";
  preGameTaskId: string;
  preGameEnabled: boolean;
  inviteBeforeEvent: boolean;
  demoEnabled: boolean;
  rules: string;
  schedule: ScheduleItem[];
  breakMinutes: number;
  finalDuration: number;
  secretRevealMode: "scheduled" | "random";
  secretRevealAfterMinutes: number;
}

export interface StoredPlan {
  id: string;
  host_id: string;
  name: string | null;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  player_count: number | null;
  venue_name: string | null;
  plan_data:
    | (Partial<SetupForm> & {
        selectedTaskIds?: string[];
        [key: string]: unknown;
      })
    | null;
}
export interface CommunityPlanTask {
  id: string;
  title: string;
  description: string | null;
  payload: Record<string, unknown> | null;
  status: string;
}
export interface PlanSnapshot extends SetupForm {
  version: 3;
  selectedTasks: Task[];
  selectedTaskIds: string[];
  locationMode: "single-venue";
  noVenueChanges: true;
  estimatedEndTime: string;
  generatedEquipment: string[];
  generatedPreparation: Array<{ title: string; prep: string }>;
}
export interface PlanWrite {
  name: string;
  host_id: string;
  event_date: string | null;
  start_time: string | null;
  end_time: string;
  player_count: number;
  venue_name: string | null;
  status: "draft" | "planned";
  plan_data: PlanSnapshot;
}
