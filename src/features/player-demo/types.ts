export type PlayerDemoPage =
  "game" | "leaderboard" | "side-challenges" | "final";

export interface PlayerDemoModel {
  page: PlayerDemoPage;
  tourOpen: boolean;
  sampleUpload: boolean;
  onSelectPage: (page: PlayerDemoPage) => void;
  onNavigateTour: (page: string) => void;
  onRestartTour: () => void;
  onCloseTour: () => void;
  onSampleAction: () => void;
}
