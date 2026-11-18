import PlanBuilder from "./PlanBuilder";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import HostWorkspace from "../host-workspace/HostWorkspace";
import ChallengeLibrary from "./ChallengeLibrary";
import GameOptions from "./GameOptions";
import LaunchSummary from "./LaunchSummary";
import PlayerInvites from "./PlayerInvites";
import PlayerSetup from "./PlayerSetup";
import ScheduleBuilder from "./ScheduleBuilder";
import SecretMissionTiming from "./SecretMissionTiming";
import PlanSidebar from "./PlanSidebar";
import PlanContext from "./PlanContext";
import PlanNavigation from "./PlanNavigation";
import GameBasicsForm from "./GameBasicsForm";
import VenueDetails from "./VenueDetails";
import PlanReviewInfo from "./PlanReviewInfo";
import { usePlanSource } from "./usePlanSource";
import { usePlanFavourites } from "./usePlanFavourites";
import { usePlanChallenges } from "./usePlanChallenges";
import { usePlanSchedule } from "./usePlanSchedule";
import { usePlanSave } from "./usePlanSave";
import { usePlanPhoto } from "./usePlanPhoto";
import { derivePlan } from "./planModel";
import { defaultForm, tabItems } from "./catalog";
import type { BuilderTab, SetupForm, TaskKind } from "./types";
import "../../styles/HostPortal.css";
import "../../styles/HostPlanning.css";
import "../../styles/HostTheme.css";
export default function PlanEditor({
  id,
  communityTaskId,
  exploreTaskJson,
  requestedChallengeKind,
}: {
  id?: string;
  communityTaskId: string | null;
  exploreTaskJson: string | null;
  requestedChallengeKind: TaskKind;
}) {
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [stage, setStage] = useState<"create" | "build">("create");
  const [tab, setTab] = useState<BuilderTab>("players");
  const [form, setForm] = useState<SetupForm>(defaultForm);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dragged, setDragged] = useState<string | null>(null);
  const update = <K extends keyof SetupForm>(key: K, value: SetupForm[K]) =>
    setForm((old) => ({ ...old, [key]: value }));
  const {
    allTasks,
    selectedMainTasks,
    sideTasks,
    secretTasks,
    equipment,
    preparation,
    sideReviewCount,
    sideRewardPoints,
    liveFinalMinutes,
    calculatedEnd,
  } = derivePlan(form);
  const { favourites, setFavourites, toggleFavourite } = usePlanFavourites({
    setError,
  });
  const { loading } = usePlanSource({
    id,
    communityTaskId,
    exploreTaskJson,
    requestedChallengeKind,
    setForm,
    setStage,
    setFavourites,
    setError,
    setNotice,
  });
  const {
    selectedIds,
    visibleTasks,
    selectTask,
    moveTask,
    dropTask,
    addCustomTask,
    favouritesOnly,
    setFavouritesOnly,
    vibeFilter,
    setVibeFilter,
    accessFilter,
    setAccessFilter,
    search,
    setSearch,
    customTitle,
    setCustomTitle,
    customDesc,
    setCustomDesc,
  } = usePlanChallenges({
    form,
    update,
    tab,
    allTasks,
    favourites,
    toggleFavourite,
    dragged,
    setDragged,
  });
  const {
    updateScheduleItem,
    setPreGameTask,
    addTaskToSchedule,
    addScheduleItem,
    deleteScheduleItem,
  } = usePlanSchedule({ form, setForm, update, allTasks, stage, setNotice });
  const { saving, save } = usePlanSave({
    id,
    form,
    navigate,
    setError,
    setNotice,
  });
  const { uploadGamePhoto } = usePlanPhoto({ id, update, setError, setNotice });
  if (loading)
    return (
      <HostWorkspace
        title="Create a game"
        subtitle="Getting your setup ready…"
        showCreate={false}
      >
        <div className="host-empty-state">Loading…</div>
      </HostWorkspace>
    );
  const header =
    stage === "create"
      ? editing
        ? "Edit game"
        : "Create a game"
      : "Build your game";
  const setupChecks = [
    {
      label: "Game details",
      done: Boolean(form.name.trim() && form.eventDate),
    },
    { label: "Players & teams", done: form.playerCount >= 2 },
    { label: "Main challenges", done: selectedMainTasks.length > 0 },
    {
      label: "Secret missions",
      done: !form.secretMissions || secretTasks.length > 0,
    },
    {
      label: "Schedule",
      done: form.schedule.some((item) => item.type === "challenge"),
    },
    { label: "Invites", done: form.inviteBeforeEvent },
    { label: "Review & launch", done: false },
  ];
  const activeTabIndex = tabItems.findIndex((item) => item.id === tab);
  const previousTab = activeTabIndex > 0 ? tabItems[activeTabIndex - 1] : null;
  const nextTab =
    activeTabIndex >= 0 ? (tabItems[activeTabIndex + 1] ?? null) : null;
  function goToPreviousSection() {
    setError("");
    if (stage === "create" || activeTabIndex === 0) {
      setStage("create");
      return;
    }
    if (previousTab) setTab(previousTab.id);
  }
  function goToNextSection() {
    setError("");
    if (stage === "create") {
      if (!form.name.trim()) {
        setError("Give your game a name.");
        return;
      }
      setStage("build");
      setTab("players");
      return;
    }
    if (nextTab) setTab(nextTab.id);
    else void save("planned");
  }
  return (
    <HostWorkspace
      title={header}
      subtitle={
        stage === "create"
          ? "Start with the essentials. You can build the experience next."
          : "Choose challenges, build the schedule and prepare your players."
      }
      showCreate={false}
      contextPanel={
        <PlanContext
          form={form}
          stage={stage}
          setupChecks={setupChecks}
          nextLabel={nextTab?.label}
          onNext={goToNextSection}
        />
      }
      sidebar={
        <PlanSidebar
          stage={stage}
          tab={tab}
          onBasics={() => setStage("create")}
          onTab={(next) => {
            setTab(next);
            setError("");
          }}
          mainCount={selectedMainTasks.length}
          sideCount={sideTasks.length}
          secretCount={secretTasks.length}
        />
      }
    >
      {error && (
        <div className="host-alert host-alert--error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="host-alert host-alert--success" role="status">
          {notice}
        </div>
      )}
      {stage === "create" ? (
        <GameBasicsForm
          form={form}
          update={update}
          uploadGamePhoto={uploadGamePhoto}
          navigation={
            <PlanNavigation stage="create" onNext={goToNextSection} />
          }
        />
      ) : (
        <PlanBuilder
          title={tabItems.find((item) => item.id === tab)?.label}
          description={tabItems.find((item) => item.id === tab)?.description}
          onBasics={() => setStage("create")}
          navigation={
            <PlanNavigation
              stage="build"
              previousLabel={previousTab?.label}
              nextLabel={nextTab?.label}
              saving={saving}
              onBack={goToPreviousSection}
              onNext={goToNextSection}
              onSave={() => void save("draft")}
            />
          }
        >
          {tab === "players" && <PlayerSetup form={form} update={update} />}

          {(tab === "main" || tab === "side" || tab === "secret") && (
            <ChallengeLibrary
              tab={tab}
              selectedIds={selectedIds}
              allTasks={allTasks}
              setDragged={setDragged}
              dropTask={dropTask}
              moveTask={moveTask}
              selectTask={selectTask}
              favouritesOnly={favouritesOnly}
              setFavouritesOnly={setFavouritesOnly}
              search={search}
              setSearch={setSearch}
              vibeFilter={vibeFilter}
              setVibeFilter={setVibeFilter}
              accessFilter={accessFilter}
              setAccessFilter={setAccessFilter}
              visibleTasks={visibleTasks}
              favourites={favourites}
              toggleFavourite={toggleFavourite}
              addCustomTask={addCustomTask}
              customTitle={customTitle}
              setCustomTitle={setCustomTitle}
              customDesc={customDesc}
              setCustomDesc={setCustomDesc}
            />
          )}

          {tab === "secret" && (
            <SecretMissionTiming form={form} update={update} />
          )}

          {tab === "venue" && <VenueDetails form={form} update={update} />}

          {tab === "controls" && <GameOptions form={form} update={update} />}

          {tab === "schedule" && (
            <ScheduleBuilder
              calculatedEnd={calculatedEnd}
              form={form}
              update={update}
              liveFinalMinutes={liveFinalMinutes}
              sideReviewCount={sideReviewCount}
              sideRewardPoints={sideRewardPoints}
              addTaskToSchedule={addTaskToSchedule}
              allTasks={allTasks}
              addScheduleItem={addScheduleItem}
              setDragged={setDragged}
              dragged={dragged}
              updateScheduleItem={updateScheduleItem}
              deleteScheduleItem={deleteScheduleItem}
            />
          )}

          {tab === "invites" && (
            <PlayerInvites
              form={form}
              update={update}
              preparation={preparation}
              setPreGameTask={setPreGameTask}
              allTasks={allTasks}
              customTitle={customTitle}
              customDesc={customDesc}
              setCustomTitle={setCustomTitle}
              setCustomDesc={setCustomDesc}
              setNotice={setNotice}
            />
          )}

          {tab === "review" && <PlanReviewInfo />}

          {tab === "launch" && (
            <LaunchSummary
              form={form}
              calculatedEnd={calculatedEnd}
              selectedMainTasks={selectedMainTasks}
              sideTasks={sideTasks}
              secretTasks={secretTasks}
              equipment={equipment}
              preparation={preparation}
            />
          )}
        </PlanBuilder>
      )}
    </HostWorkspace>
  );
}
