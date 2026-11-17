import Icon from "../components/ui/Icon";
import ChallengeLibrary from "../features/host-planning/ChallengeLibrary";
import GameOptions from "../features/host-planning/GameOptions";
import LaunchSummary from "../features/host-planning/LaunchSummary";
import PlayerInvites from "../features/host-planning/PlayerInvites";
import PlayerSetup from "../features/host-planning/PlayerSetup";
import ScheduleBuilder from "../features/host-planning/ScheduleBuilder";
import SecretMissionTiming from "../features/host-planning/SecretMissionTiming";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import HostShell from "../components/host/HostShell";
import { Field } from "../components/ui/Field";
import {
  defaultForm,
  tabItems,
  taskLibrary,
} from "../features/host-planning/catalog";
import {
  type BuilderTab,
  type Favourite,
  type ScheduleItem,
  type SetupForm,
  type Task,
  type TaskKind,
} from "../features/host-planning/types";
import { supabase } from "../lib/sessionSupabase";
import { timePlus, today } from "../utils/dateTime";
import "../styles/HostPortal.css";
import "../styles/HostPlanning.css";
import "../styles/HostTheme.css";

export default function HostPlanSetup() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const communityTaskId = searchParams.get("communityTask");
  const exploreTaskJson = searchParams.get("exploreTask");
  const requestedChallengeKind =
    searchParams.get("challengeKind") === "side" ? "side" : "main";
  const editing = Boolean(id);
  const [stage, setStage] = useState<"create" | "build">("create");
  const [tab, setTab] = useState<BuilderTab>("players");
  const [form, setForm] = useState<SetupForm>(defaultForm);
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [vibeFilter, setVibeFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [loading, setLoading] = useState(
    Boolean(id || communityTaskId || exploreTaskJson),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dragged, setDragged] = useState<string | null>(null);

  const update = <K extends keyof SetupForm>(key: K, value: SetupForm[K]) =>
    setForm((old) => ({ ...old, [key]: value }));
  const allTasks = useMemo(
    () => [...taskLibrary, ...form.customTasks],
    [form.customTasks],
  );
  const selectedIds =
    tab === "side"
      ? form.selectedSide
      : tab === "secret"
        ? form.selectedSecret
        : [];
  const selectedTasks = allTasks.filter(
    (t) =>
      form.selectedMain.includes(t.id) ||
      form.selectedSide.includes(t.id) ||
      form.selectedSecret.includes(t.id) ||
      (form.preGameEnabled && form.preGameTaskId === t.id),
  );
  const visibleTasks = allTasks
    .filter(
      (t) =>
        t.kind ===
        (tab === "main" ? "main" : tab === "side" ? "side" : "secret"),
    )
    .filter(
      (t) =>
        !favouritesOnly ||
        favourites.some((f) => f.item_type === "task" && f.item_id === t.id),
    )
    .filter((t) => vibeFilter === "all" || t.vibe.includes(vibeFilter))
    .filter(
      (t) => accessFilter === "all" || t.accessibility.includes(accessFilter),
    )
    .filter((t) => form.accessibility.every((a) => t.accessibility.includes(a)))
    .filter((t) =>
      `${t.title} ${t.description} ${t.equipment.join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  const selectedMainTasks = form.selectedMain
    .map((taskId) => allTasks.find((t) => t.id === taskId))
    .filter(Boolean) as Task[];
  const sideTasks = form.selectedSide
    .map((taskId) => allTasks.find((t) => t.id === taskId))
    .filter(Boolean) as Task[];
  const secretTasks = form.selectedSecret
    .map((taskId) => allTasks.find((t) => t.id === taskId))
    .filter(Boolean) as Task[];
  const equipment = [...new Set(selectedTasks.flatMap((t) => t.equipment))];
  const preparation = selectedTasks.filter(
    (t) => t.prep && !/no preparation required/i.test(t.prep),
  );

  useEffect(() => {
    let live = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        if (live) {
          setError("Your host session has expired. Please log in again.");
          setLoading(false);
        }
        return;
      }
      const { data: favs } = await supabase
        .from("host_favourites")
        .select("id,item_type,item_id")
        .eq("host_id", auth.user.id);
      if (live) setFavourites((favs ?? []) as Favourite[]);
      if (id) {
        const { data, error: loadError } = await supabase
          .from("host_games")
          .select("*")
          .eq("id", id)
          .eq("host_id", auth.user.id)
          .maybeSingle();
        if (!live) return;
        if (loadError || !data) setError("Couldn't load this game plan.");
        else {
          const p = (data.plan_data ?? {}) as Partial<SetupForm> &
            Record<string, unknown>;
          setForm({
            ...defaultForm,
            ...p,
            name: String(data.name ?? p.name ?? ""),
            eventDate: String(data.event_date ?? p.eventDate ?? today()),
            startTime: String(data.start_time ?? p.startTime ?? "18:00").slice(
              0,
              5,
            ),
            idealEndTime: String(
              data.end_time ?? p.idealEndTime ?? "22:00",
            ).slice(0, 5),
            playerCount: Number(data.player_count ?? p.playerCount ?? 12),
            venueName: String(data.venue_name ?? p.venueName ?? ""),
            selectedMain: Array.isArray(p.selectedMain)
              ? p.selectedMain
              : Array.isArray(p.selectedTaskIds)
                ? p.selectedTaskIds.filter((x) =>
                    taskLibrary.some((t) => t.id === x && t.kind === "main"),
                  )
                : defaultForm.selectedMain,
            selectedSide: Array.isArray(p.selectedSide)
              ? p.selectedSide
              : defaultForm.selectedSide,
            selectedSecret: Array.isArray(p.selectedSecret)
              ? p.selectedSecret
              : defaultForm.selectedSecret,
            customTasks: Array.isArray(p.customTasks)
              ? (p.customTasks as Task[])
              : [],
          });
          setStage("build");
        }
      } else if (communityTaskId) {
        const { data: submission, error: communityError } = await supabase
          .from("cc_catalog_submissions")
          .select("id,title,description,payload,status")
          .eq("id", communityTaskId)
          .eq("item_type", "challenge")
          .eq("status", "approved")
          .maybeSingle();
        if (!live) return;
        if (communityError || !submission) {
          setError(
            "That community challenge is no longer available. Return to Explore and choose another one.",
          );
        } else {
          const payload = (submission.payload ?? {}) as Record<string, unknown>;
          const kind: TaskKind = requestedChallengeKind;
          const task: Task = {
            id: `community-${submission.id}`,
            title: String(submission.title),
            description: String(submission.description ?? ""),
            kind,
            minutes: Math.max(1, Number(payload.minutes ?? 10)),
            prepMinutes: Number(payload.prepMinutes ?? 0) || undefined,
            performanceMinutes:
              Number(payload.performanceMinutes ?? 0) || undefined,
            points: Math.max(0, Number(payload.points ?? 20)),
            vibe: Array.isArray(payload.tags)
              ? payload.tags.map(String)
              : ["community"],
            accessibility: ["seated-option", "low-noise-option"],
            equipment: [],
            setup:
              payload.setup === "basic"
                ? "Prepare the basic equipment needed for this challenge."
                : payload.setup === "some"
                  ? "Some preparation may be needed before this challenge."
                  : "No special setup.",
            prep:
              payload.setup === "none"
                ? "No preparation required."
                : "Check the challenge setup before the event.",
            evidenceRequired: kind === "side",
            tags: Array.isArray(payload.tags)
              ? payload.tags.map(String)
              : ["Community"],
          };
          setForm((current) => ({
            ...current,
            customTasks: [
              ...current.customTasks.filter((item) => item.id !== task.id),
              task,
            ],
            selectedMain:
              kind === "main"
                ? [...new Set([...current.selectedMain, task.id])]
                : current.selectedMain,
            selectedSide:
              kind === "side"
                ? [...new Set([...current.selectedSide, task.id])]
                : current.selectedSide,
            sideChallenges: kind === "side" ? true : current.sideChallenges,
          }));
          setNotice(
            `Added “${task.title}” as a ${kind} challenge. Finish the game details, then find it in ${kind === "main" ? "Main Challenges" : "Side challenges"}.`,
          );
        }
      } else if (exploreTaskJson) {
        try {
          const idea = JSON.parse(exploreTaskJson) as {
            id: string;
            title: string;
            description: string;
            points: number;
            minutes: number;
            prepMinutes?: number;
            performanceMinutes?: number;
            tags?: string[];
            setup?: string;
          };
          const kind: TaskKind = requestedChallengeKind;
          const task: Task = {
            id: `explore-${idea.id}`,
            title: idea.title,
            description: idea.description,
            kind,
            minutes: Math.max(1, Number(idea.minutes) || 10),
            prepMinutes: Number(idea.prepMinutes ?? 0) || undefined,
            performanceMinutes:
              Number(idea.performanceMinutes ?? 0) || undefined,
            points: Math.max(0, Number(idea.points) || 0),
            vibe: idea.tags ?? [],
            accessibility: ["seated-option", "low-noise-option"],
            equipment: [],
            setup:
              idea.setup === "basic"
                ? "Prepare basic equipment."
                : idea.setup === "some"
                  ? "Some preparation may be needed."
                  : "No special setup.",
            prep: "No preparation required.",
            evidenceRequired: kind === "side",
            tags: idea.tags ?? [],
          };
          setForm((current) => ({
            ...current,
            customTasks: [
              ...current.customTasks.filter((item) => item.id !== task.id),
              task,
            ],
            selectedMain:
              kind === "main"
                ? [...new Set([...current.selectedMain, task.id])]
                : current.selectedMain,
            selectedSide:
              kind === "side"
                ? [...new Set([...current.selectedSide, task.id])]
                : current.selectedSide,
            sideChallenges: kind === "side" ? true : current.sideChallenges,
          }));
          setNotice(
            `Added “${task.title}” as a ${kind} challenge. Finish the game details, then find it in ${kind === "main" ? "Main Challenges" : "Side challenges"}.`,
          );
        } catch {
          setError(
            "Couldn't add that Explore challenge. Return to Explore and try again.",
          );
        }
      }
      if (live) setLoading(false);
    })();
    return () => {
      live = false;
    };
  }, [id, communityTaskId, exploreTaskJson, requestedChallengeKind]);

  useEffect(() => {
    if (stage !== "build" || form.schedule.length) return;
    const preTask = allTasks.find((t) => t.id === form.preGameTaskId);
    const items: ScheduleItem[] = [
      ...(form.preGameEnabled && preTask
        ? [
            {
              id: "pregame",
              type: "pregame" as const,
              title: `Pre-game: ${preTask.title}`,
              duration: 0,
              taskId: preTask.id,
            },
          ]
        : []),
      {
        id: "welcome",
        type: "welcome",
        title: "Game begins & welcome",
        duration: 10,
      },
      ...(form.teamsEnabled
        ? [
            {
              id: "teams",
              type: "teams" as const,
              title: "Team selection",
              duration: 15,
            },
          ]
        : []),
      ...(form.preGameEnabled && form.preGameTaskId
        ? [
            {
              id: "pregame-review",
              type: "pregame-review" as const,
              title: "Review & vote on pre-game challenge",
              duration: 15,
            },
          ]
        : []),
      ...(form.secretMissions &&
      form.selectedSecret.length &&
      form.secretRevealMode === "scheduled"
        ? [
            {
              id: "secret-reveal",
              type: "secret-reveal" as const,
              title: "Reveal secret missions",
              duration: 0,
            },
          ]
        : []),
    ];
    update("schedule", items);
    // Initialise the timeline once. Subsequent edits are intentionally preserved.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  async function toggleFavourite(task: Task) {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setError("Please log in again.");
      return;
    }
    const found = favourites.find(
      (f) => f.item_type === "task" && f.item_id === task.id,
    );
    if (found) {
      const { error: e } = await supabase
        .from("host_favourites")
        .delete()
        .eq("id", found.id);
      if (e) setError(e.message);
      else setFavourites((f) => f.filter((x) => x.id !== found.id));
    } else {
      const { data, error: e } = await supabase
        .from("host_favourites")
        .insert({
          host_id: auth.user.id,
          item_type: "task",
          item_id: task.id,
          item_data: task,
        })
        .select("id,item_type,item_id")
        .single();
      if (e) setError(e.message);
      else if (data) setFavourites((f) => [...f, data as Favourite]);
    }
  }
  function selectTask(task: Task) {
    const key =
      task.kind === "main"
        ? "selectedMain"
        : task.kind === "side"
          ? "selectedSide"
          : "selectedSecret";
    const list = form[key];
    const removing = list.includes(task.id);
    update(
      key,
      removing ? list.filter((x) => x !== task.id) : [...list, task.id],
    );
    if (
      task.kind === "secret" &&
      !removing &&
      form.secretRevealMode === "scheduled" &&
      !form.schedule.some((item) => item.type === "secret-reveal")
    ) {
      update("schedule", [
        ...form.schedule,
        {
          id: "secret-reveal",
          type: "secret-reveal",
          title: "Reveal secret missions",
          duration: 0,
        },
      ]);
    }
    if (task.kind === "secret" && removing && list.length === 1)
      update(
        "schedule",
        form.schedule.filter((item) => item.type !== "secret-reveal"),
      );
  }
  function moveTask(taskId: string, direction: -1 | 1) {
    const index = form.selectedMain.indexOf(taskId);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= form.selectedMain.length) return;
    const arr = [...form.selectedMain];
    [arr[index], arr[next]] = [arr[next], arr[index]];
    update("selectedMain", arr);
  }
  function dropTask(targetId: string) {
    if (!dragged || dragged === targetId) return;
    const arr = [...form.selectedMain];
    const from = arr.indexOf(dragged);
    const to = arr.indexOf(targetId);
    if (from < 0 || to < 0) return;
    arr.splice(from, 1);
    arr.splice(to, 0, dragged);
    update("selectedMain", arr);
    setDragged(null);
  }
  function addCustomTask(e: FormEvent) {
    e.preventDefault();
    if (!customTitle.trim()) return;
    const kind: TaskKind =
      tab === "side" ? "side" : tab === "secret" ? "secret" : "main";
    const task: Task = {
      id: `custom-${Date.now()}`,
      title: customTitle.trim(),
      description: customDesc.trim() || "Custom challenge created by the host.",
      kind,
      minutes: 15,
      points: 10,
      vibe: ["creative"],
      accessibility: ["seated-option"],
      equipment: [],
      setup: "Add setup instructions.",
      prep: "No preparation required.",
      evidenceRequired: kind !== "main",
    };
    update("customTasks", [...form.customTasks, task]);
    if (tab === "main") void toggleFavourite(task);
    else selectTask(task);
    setCustomTitle("");
    setCustomDesc("");
  }
  async function uploadGamePhoto(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Game images must be 8 MB or smaller.");
      return;
    }
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setError("Please log in again.");
      return;
    }
    const path = `${auth.user.id}/${id ?? `draft-${Date.now()}`}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const { error: uploadError } = await supabase.storage
      .from("game-assets")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      setError(
        `Photo upload failed: ${uploadError.message}. Create the game-assets storage bucket using the included migration.`,
      );
      return;
    }
    const { data } = supabase.storage.from("game-assets").getPublicUrl(path);
    update("gamePhotoUrl", data.publicUrl);
    setNotice("Game photo uploaded.");
  }

  function updateScheduleItem(itemId: string, patch: Partial<ScheduleItem>) {
    update(
      "schedule",
      form.schedule.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item,
      ),
    );
  }
  function setPreGameTask(taskId: string, enabled = form.preGameEnabled) {
    update("preGameTaskId", taskId);
    const task = allTasks.find((item) => item.id === taskId);
    const withoutPreGame = form.schedule.filter(
      (item) => item.type !== "pregame" && item.type !== "pregame-review",
    );
    if (!task || !enabled) {
      update("schedule", withoutPreGame);
      return;
    }
    const welcomeIndex = withoutPreGame.findIndex(
      (item) => item.type === "welcome",
    );
    const insertAt = welcomeIndex >= 0 ? welcomeIndex + 1 : 0;
    const additions: ScheduleItem[] = [
      {
        id: "pregame",
        type: "pregame",
        title: `Pre-game: ${task.title}`,
        duration: 0,
        taskId: task.id,
      },
      {
        id: "pregame-review",
        type: "pregame-review",
        title: "Review & vote on pre-game challenge",
        duration: 15,
      },
    ];
    withoutPreGame.splice(insertAt, 0, ...additions);
    update("schedule", withoutPreGame);
  }
  function addTaskToSchedule(taskId: string) {
    const task = allTasks.find((t) => t.id === taskId);
    if (!task) return;
    if (
      form.schedule.some(
        (item) => item.type === "challenge" && item.taskId === taskId,
      )
    ) {
      setNotice("That challenge is already in the schedule.");
      return;
    }
    update("selectedMain", [...form.selectedMain, taskId]);
    const stamp = Date.now();
    if (task.prepMinutes || task.performanceMinutes) {
      const phases: ScheduleItem[] = [];
      if (task.prepMinutes)
        phases.push({
          id: `task-${task.id}-prep-${stamp}`,
          type: "challenge",
          title: `${task.title} — Player prep`,
          duration: task.prepMinutes,
          taskId: task.id,
          phase: "prep",
          editable: true,
        });
      if (task.performanceMinutes)
        phases.push({
          id: `task-${task.id}-performance-${stamp}`,
          type: "challenge",
          title: `${task.title} — Player performance`,
          duration: task.performanceMinutes,
          taskId: task.id,
          phase: "performance",
          editable: true,
        });
      update("schedule", [...form.schedule, ...phases]);
    } else {
      update("schedule", [
        ...form.schedule,
        {
          id: `task-${task.id}-${stamp}`,
          type: "challenge",
          title: task.title,
          duration: task.minutes,
          taskId: task.id,
          editable: true,
        },
      ]);
    }
    setNotice(`Added “${task.title}” to the schedule.`);
  }
  function addScheduleItem(type: "break" | "challenge") {
    if (type === "break")
      update("schedule", [
        ...form.schedule,
        {
          id: `break-${Date.now()}`,
          type: "break",
          title: "Break",
          duration: 15,
        },
      ]);
    else
      update("schedule", [
        ...form.schedule,
        {
          id: `custom-schedule-${Date.now()}`,
          type: "challenge",
          title: "New challenge",
          duration: 15,
          editable: true,
        },
      ]);
  }
  function deleteScheduleItem(itemId: string) {
    const removed = form.schedule.find((item) => item.id === itemId);
    const nextSchedule = form.schedule.filter((item) => item.id !== itemId);
    update("schedule", nextSchedule);
    if (
      removed?.type === "challenge" &&
      removed.taskId &&
      !nextSchedule.some(
        (item) => item.type === "challenge" && item.taskId === removed.taskId,
      )
    ) {
      update(
        "selectedMain",
        form.selectedMain.filter((id) => id !== removed.taskId),
      );
    }
  }
  const sideReviewCount = form.sideChallenges ? sideTasks.length : 0;
  const sideReviewMinutes = sideReviewCount * 5;
  const sideRewardPoints = form.sideChallenges
    ? sideTasks.reduce((sum, task) => sum + task.points, 0)
    : 0;
  const liveFinalMinutes = form.sideChallenges
    ? form.finalDuration + sideReviewMinutes
    : 0;
  function scheduleTotal() {
    return (
      form.schedule.reduce((sum, item) => sum + item.duration, 0) +
      liveFinalMinutes
    );
  }
  const calculatedEnd = timePlus(form.startTime, scheduleTotal());
  function validate() {
    if (!form.name.trim()) return "Add a game name.";
    if (!form.eventDate) return "Choose the event date.";
    if (form.playerCount < 2 || form.playerCount > 100)
      return "Choose an approximate player count between 2 and 100.";
    if (!form.schedule.some((item) => item.type === "challenge"))
      return "Add at least one main challenge to the Schedule.";
    if (form.sideChallenges && !form.selectedSide.length)
      return "Add at least one side challenge or turn side challenges off.";
    if (form.secretMissions && !form.selectedSecret.length)
      return "Add at least one secret mission or turn secret missions off.";
    if (form.sideChallenges && (!form.liveFinal || !form.slideshow))
      return "Side challenges require a live final and slideshow. These have been enabled automatically.";
    return "";
  }
  async function save(status: "draft" | "planned") {
    const issue = status === "planned" ? validate() : "";
    if (issue) {
      setError(issue);
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setSaving(false);
      setError("Your host session expired. Log in again.");
      return;
    }
    const planData = {
      version: 3,
      ...form,
      selectedTasks: selectedTasks,
      selectedTaskIds: [
        ...form.selectedMain,
        ...form.selectedSide,
        ...form.selectedSecret,
      ],
      locationMode: "single-venue",
      noVenueChanges: true,
      estimatedEndTime: calculatedEnd,
      generatedEquipment: equipment,
      generatedPreparation: preparation.map((t) => ({
        title: t.title,
        prep: t.prep,
      })),
    };
    const payload = {
      name: form.name.trim() || "Untitled chaos",
      host_id: auth.user.id,
      event_date: form.eventDate || null,
      start_time: form.startTime || null,
      end_time: form.idealEndTime || calculatedEnd,
      player_count: form.playerCount,
      venue_name: form.venueName.trim() || null,
      status,
      plan_data: planData,
    };
    let savedId = id;
    let saveError: Error | null = null;
    if (id) {
      const { error } = await supabase
        .from("host_games")
        .update({
          name: payload.name,
          event_date: payload.event_date,
          start_time: payload.start_time,
          end_time: payload.end_time,
          player_count: payload.player_count,
          venue_name: payload.venue_name,
          status,
          plan_data: payload.plan_data,
        })
        .eq("id", id)
        .eq("host_id", auth.user.id);
      if (error) saveError = error;
    } else {
      const { data, error } = await supabase
        .from("host_games")
        .insert(payload)
        .select("id")
        .single();
      if (error) saveError = error;
      else savedId = data?.id ? String(data.id) : undefined;
    }
    setSaving(false);
    if (saveError || !savedId) {
      setError(saveError?.message ?? "Couldn't save the game plan.");
      return;
    }
    if (status === "draft") {
      setNotice("Draft saved.");
      if (!id) navigate(`/host/games/${savedId}/edit`, { replace: true });
    } else navigate("/host?created=1", { replace: true });
  }

  if (loading)
    return (
      <HostShell
        title="Create a game"
        subtitle="Getting your setup ready…"
        showCreate={false}
      >
        <div className="host-empty-state">Loading…</div>
      </HostShell>
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
  const completedSetup = setupChecks.filter((item) => item.done).length;
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
  const setupSidebar = (
    <nav className="host-setup-sidebar" aria-label="Game setup steps">
      <div className="host-setup-sidebar-title">YOUR GAME</div>
      <button
        type="button"
        className={`host-setup-step${stage === "create" ? " is-active" : " is-done"}`}
        onClick={() => setStage("create")}
      >
        <span className="host-setup-step-number">
          {stage === "build" ? (
            <Icon name="check" className="icon--size-15" />
          ) : (
            "1"
          )}
        </span>
        <span>
          <strong>Game basics</strong>
          <small>Name, date and player count</small>
        </span>
      </button>
      <div className="host-setup-sidebar-divider" />
      {stage === "create" ? (
        <div className="host-setup-next-step">
          <span className="host-setup-step-number">2</span>
          <span>
            <strong>Build your game</strong>
            <small>Add challenges, set the schedule and prepare players.</small>
          </span>
        </div>
      ) : (
        tabItems.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`host-setup-step${tab === item.id ? " is-active" : ""}`}
            onClick={() => {
              setTab(item.id);
              setError("");
            }}
          >
            <span className="host-setup-step-number">{index + 2}</span>
            <span>
              <strong>{item.label}</strong>
              <small>{item.description}</small>
            </span>
          </button>
        ))
      )}
      {stage === "build" && (
        <div className="host-setup-sidebar-summary">
          <strong>{selectedMainTasks.length} main</strong>
          <strong>{sideTasks.length} side</strong>
          <strong>{secretTasks.length} secret</strong>
        </div>
      )}
    </nav>
  );
  const contextPanel = (
    <div className="host-game-context">
      <section className="host-context-card host-context-overview">
        <div className="host-context-ribbon">GAME OVERVIEW</div>
        <div className="host-context-art">
          <Icon name="sparkles" className="icon--size-34" />
          <span>CHAOS!</span>
        </div>
        <h3>{form.name || "Your new game"}</h3>
        <ul>
          <li>
            <Icon name="calendar-days" className="icon--size-15" />
            {form.eventDate || "Date to be confirmed"}
          </li>
          <li>
            <Icon name="users" className="icon--size-15" />
            {form.playerCount} players (target)
          </li>
          <li>
            <Icon name="map-pin" className="icon--size-15" />
            {form.venueName || "Venue not set"}
          </li>
        </ul>
      </section>
      <section className="host-context-card host-context-progress">
        <div className="host-context-ribbon">SETUP PROGRESS</div>
        <strong className="host-context-progress-count">
          {completedSetup} of {setupChecks.length} complete
        </strong>
        <div className="host-context-progress-track">
          <span
            style={{ width: `${(completedSetup / setupChecks.length) * 100}%` }}
          />
        </div>
        <ul>
          {setupChecks.map((item, index) => (
            <li key={item.label} className={item.done ? "is-complete" : ""}>
              <span className="host-context-check">
                {item.done ? "✓" : index + 1}
              </span>
              {item.label}
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="host-context-continue"
          onClick={goToNextSection}
        >
          {stage === "create"
            ? "Next: Players & Teams →"
            : nextTab
              ? `Next: ${nextTab.label} →`
              : "Save game plan →"}
        </button>
      </section>
      <div className="host-context-tip">
        <Icon name="sparkles" className="icon--size-17" />
        <span>
          <strong>Little by little.</strong> You can save a draft and come back
          whenever inspiration strikes.
        </span>
      </div>
    </div>
  );
  return (
    <HostShell
      title={header}
      subtitle={
        stage === "create"
          ? "Start with the essentials. You can build the experience next."
          : "Choose challenges, build the schedule and prepare your players."
      }
      showCreate={false}
      contextPanel={contextPanel}
      sidebar={setupSidebar}
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
        <section className="cc-create-card">
          <div className="cc-step-kicker">
            <Icon name="sparkles" className="icon--size-16" /> STEP 1 · GAME
            BASICS
          </div>
          <h2>Let's set the scene</h2>
          <p className="cc-muted">
            Just the essentials. The detailed planning happens in the next step.
          </p>
          <div className="cc-photo-field">
            <div className="cc-photo-preview">
              {form.gamePhotoUrl ? (
                <img src={form.gamePhotoUrl} alt="Game cover" />
              ) : (
                <Icon name="image-plus" className="icon--size-34" />
              )}
            </div>
            <div>
              <strong>Game photo</strong>
              <p>
                Add a photo or graphic to personalise the player welcome screen.
              </p>
              <label className="cc-upload-button">
                <Icon name="upload" className="icon--size-15" /> Choose image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadGamePhoto(f);
                  }}
                />
              </label>
            </div>
          </div>
          <div className="cc-form-grid">
            <Field label="Game name">
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Iona's birthday chaos"
              />
            </Field>
            <Field label="Event date">
              <input
                type="date"
                min={today()}
                value={form.eventDate}
                onChange={(e) => update("eventDate", e.target.value)}
              />
            </Field>
            <Field label="Start time">
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => update("startTime", e.target.value)}
              />
            </Field>
            <Field
              label="Ideal end time"
              hint="A target, not a hard stop. The schedule will estimate the finish time."
            >
              <input
                type="time"
                value={form.idealEndTime}
                onChange={(e) => update("idealEndTime", e.target.value)}
              />
            </Field>
            <Field label="Approximate number of players">
              <input
                type="number"
                min={2}
                max={100}
                value={form.playerCount}
                onChange={(e) => update("playerCount", Number(e.target.value))}
              />
            </Field>
          </div>
          <nav
            className="cc-section-navigation setup-navigation"
            aria-label="Game setup navigation"
          >
            <button type="button" className="cc-secondary" disabled>
              <Icon name="arrow-left" className="icon--size-16" /> Back
            </button>
            <button
              type="button"
              className="cc-primary"
              onClick={goToNextSection}
            >
              Next: Players &amp; Teams{" "}
              <Icon name="arrow-right" className="icon--size-17" />
            </button>
          </nav>
        </section>
      ) : (
        <div className="cc-builder">
          <main className="cc-builder-main">
            <div className="cc-builder-heading">
              <div>
                <span className="cc-step-kicker">
                  STEP 2 · BUILD YOUR EXPERIENCE
                </span>
                <h2>{tabItems.find((t) => t.id === tab)?.label}</h2>
                <p>{tabItems.find((t) => t.id === tab)?.description}</p>
              </div>
              <button
                className="cc-text-button"
                onClick={() => setStage("create")}
              >
                <Icon name="arrow-left" className="icon--size-15" /> Game basics
              </button>
            </div>

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

            {tab === "venue" && (
              <section className="cc-section-card">
                <div className="cc-explainer">
                  <Icon name="map-pin" className="icon--size-18" />
                  <p>
                    Venue planning will be expanded later. For now, save the
                    main venue so the host and players know where the game is
                    happening.
                  </p>
                </div>
                <div className="cc-form-grid">
                  <Field label="Venue name">
                    <input
                      value={form.venueName}
                      onChange={(e) => update("venueName", e.target.value)}
                      placeholder="Venue name"
                    />
                  </Field>
                  <Field label="Address">
                    <input
                      value={form.venueAddress}
                      onChange={(e) => update("venueAddress", e.target.value)}
                      placeholder="Address or postcode"
                    />
                  </Field>
                </div>
                <Field label="Venue notes">
                  <textarea
                    value={form.venueNotes}
                    onChange={(e) => update("venueNotes", e.target.value)}
                    rows={3}
                    placeholder="Access instructions, room details, booking notes…"
                  />
                </Field>
              </section>
            )}

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

            {tab === "review" && (
              <section className="cc-section-card">
                <div className="cc-explainer">
                  <Icon name="info" className="icon--size-18" />
                  <p>
                    <strong>
                      Submission review happens during the live game.
                    </strong>{" "}
                    Once you launch a session, use the Host Controls and Review
                    tools there to inspect player submissions, approve evidence
                    and manage scores.
                  </p>
                </div>
                <p>
                  Before launch, use Review & Launch for the final plan checks.
                </p>
              </section>
            )}

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

            <nav
              className="cc-section-navigation setup-navigation"
              aria-label="Game setup navigation"
            >
              <button
                type="button"
                className="cc-secondary"
                onClick={goToPreviousSection}
              >
                <Icon name="arrow-left" className="icon--size-16" /> Back
                {previousTab ? `: ${previousTab.label}` : ": Game basics"}
              </button>
              <div className="cc-section-navigation-actions">
                <button
                  type="button"
                  className="cc-secondary"
                  disabled={saving}
                  onClick={() => void save("draft")}
                >
                  Save draft
                </button>
                <button
                  type="button"
                  className="cc-primary"
                  disabled={saving}
                  onClick={goToNextSection}
                >
                  {saving
                    ? "Saving…"
                    : nextTab
                      ? `Next: ${nextTab.label}`
                      : "Save game plan"}
                  {nextTab ? (
                    <Icon name="arrow-right" className="icon--size-16" />
                  ) : (
                    <Icon name="check-circle2" className="icon--size-16" />
                  )}
                </button>
              </div>
            </nav>
          </main>
        </div>
      )}
    </HostShell>
  );
}
