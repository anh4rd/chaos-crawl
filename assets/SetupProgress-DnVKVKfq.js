var e=`import ChecklistProgress from "../../components/ui/ChecklistProgress";
import SetupAction from "../../components/ui/SetupAction";
import Icon from "../../components/ui/Icon";
import type { HostGame } from "../../types/hostHub";
export default function SetupProgress({
  dashboardGame,
  readOnly,
  onEdit,
  onPlay,
  onCreate,
}: {
  dashboardGame: HostGame | null;
  readOnly: boolean;
  onEdit: (id: string) => void;
  onPlay: (game: HostGame) => void;
  onCreate: () => void;
}) {
  const setupChecks = dashboardGame
    ? [
        {
          label: "Game details",
          done: Boolean(dashboardGame.name && dashboardGame.event_date),
        },
        { label: "Players & teams", done: dashboardGame.player_count >= 2 },
        { label: "Venue", done: Boolean(dashboardGame.venue_name) },
        {
          label: "Ready to play",
          done:
            dashboardGame.status === "planned" ||
            dashboardGame.status === "live",
        },
      ]
    : [];
  const setupDone = setupChecks.filter((item) => item.done).length;
  const checks = dashboardGame
    ? setupChecks.map((item) => ({
        ...item,
        marker: item.done ? (
          <Icon name="check" className="icon--size-14" />
        ) : (
          "○"
        ),
      }))
    : undefined;
  const actionLabel =
    dashboardGame?.status === "live"
      ? "Resume live game"
      : dashboardGame?.status === "planned"
        ? "Play this game"
        : dashboardGame
          ? "Continue setup"
          : "Plan your first game";
  function continueSetup() {
    if (!dashboardGame) {
      onCreate();
      return;
    }
    if (dashboardGame.status === "planned" || dashboardGame.status === "live") {
      void onPlay(dashboardGame);
      return;
    }
    onEdit(dashboardGame.id);
  }
  return (
    <ChecklistProgress
      checks={checks}
      summary={
        <>
          {setupDone} of {setupChecks.length} details set
        </>
      }
    >
      <SetupAction type="button" disabled={readOnly} onClick={continueSetup}>
        {actionLabel} <Icon name="arrow-right" className="icon--size-16" />
      </SetupAction>
    </ChecklistProgress>
  );
}
`;export{e as default};