import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CalendarDays,
  Check,
  CheckCircle2,
  GripVertical,
  Heart,
  ImagePlus,
  Info,
  ListChecks,
  MapPin,
  Play,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Users,
  WandSparkles,
} from "lucide-react";
import { supabase } from "../lib/sessionSupabase";
import { challengeIcon } from "../lib/challengeVisuals";
import HostShell from "../components/host/HostShell";
import "../styles/HostPortal.css";
import "../styles/HostPlanning.css";
import "../styles/HostTheme.css";

type TaskKind = "main" | "side" | "secret";
type BuilderTab =
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
type RewardMode = "voting" | "host-awards" | "audience-cheers";
type Task = {
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
type ScheduleItem = {
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
type Favourite = { id: string; item_type: "task" | "venue"; item_id: string };

interface SetupForm {
  name: string;
  eventDate: string;
  startTime: string;
  idealEndTime: string;
  playerCount: number;
  gamePhotoUrl: string;
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

const today = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};
const taskLibrary: Task[] = [
  {
    id: "pineapple",
    title: "Conceal a pineapple",
    description:
      "Hide a pineapple somewhere on your person and get a photo or video.",
    kind: "main",
    minutes: 20,
    points: 20,
    vibe: ["silly", "creative"],
    accessibility: ["standing", "mobility-flexible"],
    equipment: ["Pineapple"],
    setup: "Give each team a pineapple or agree what counts as a pineapple.",
    prep: "Collect pineapples before the round.",
    evidenceRequired: false,
    tags: ["Photo optional", "Team"],
  },
  {
    id: "best-costume",
    title: "Best costume (bin bags)",
    description: "Create a costume using only bin bags.",
    kind: "main",
    minutes: 20,
    points: 20,
    vibe: ["creative", "silly"],
    accessibility: ["seated-option", "standing"],
    equipment: ["Bin bags (x3+)", "Tape", "Scissors"],
    setup:
      "Put a bundle of bin bags, tape and scissors at the challenge station.",
    prep: "Have materials ready at the next venue.",
    evidenceRequired: false,
    tags: ["Prep required", "Team"],
  },
  {
    id: "best-entrance",
    title: "Make the best entrance",
    description: "Make an unforgettable entrance to the party.",
    kind: "main",
    minutes: 5,
    points: 15,
    vibe: ["performance", "silly"],
    accessibility: ["seated-option", "low-noise-option"],
    equipment: [],
    setup: "Choose a safe, clear entrance area.",
    prep: "Tell players to prepare an entrance before they arrive.",
    evidenceRequired: false,
    preGame: true,
    tags: ["Pre-game", "Preparation"],
  },
  {
    id: "talent-show",
    title: "One-minute talent show",
    description: "Perform a one-minute act for the group.",
    kind: "main",
    minutes: 25,
    points: 25,
    vibe: ["performance", "creative"],
    accessibility: ["seated-option", "low-noise-option"],
    equipment: ["Optional props", "Speaker"],
    setup: "Make a small performance space and check sound levels.",
    prep: "Players should prepare an act before the event.",
    evidenceRequired: false,
    tags: ["Prep required", "Performance"],
  },
  {
    id: "best-noise",
    title: "Make the best noise",
    description:
      "Create a noise that will make the host laugh without disrupting other guests.",
    kind: "main",
    minutes: 5,
    points: 15,
    vibe: ["silly", "performance"],
    accessibility: ["low-noise-option", "seated-option"],
    equipment: [],
    setup: "No special setup.",
    prep: "No preparation required.",
    evidenceRequired: false,
    tags: ["Quick"],
  },
  {
    id: "team-handshake",
    title: "Invent a secret handshake",
    description:
      "Create and perform a team handshake that lasts exactly five seconds.",
    kind: "side",
    minutes: 10,
    points: 10,
    vibe: ["creative", "social"],
    accessibility: ["seated-option"],
    equipment: [],
    setup: "No special setup.",
    prep: "No preparation required.",
    evidenceRequired: true,
    tags: ["Team"],
  },
  {
    id: "team-toast",
    title: "The suspicious toast",
    description:
      "Get a teammate to make a dramatic toast without telling them why.",
    kind: "side",
    minutes: 10,
    points: 10,
    vibe: ["social", "silly"],
    accessibility: ["low-noise-option"],
    equipment: [],
    setup: "No special setup.",
    prep: "No preparation required.",
    evidenceRequired: true,
    tags: ["Optional"],
  },
  {
    id: "team-laugh",
    title: "Make your team laugh",
    description:
      "Make every teammate laugh without touching them or using your phone.",
    kind: "side",
    minutes: 5,
    points: 10,
    vibe: ["silly", "social"],
    accessibility: ["seated-option", "low-noise-option"],
    equipment: [],
    setup: "No special setup.",
    prep: "No preparation required.",
    evidenceRequired: true,
    tags: ["Quick"],
  },
  {
    id: "secret-word",
    title: "Sneak in the word",
    description:
      "Use the word 'pineapple' naturally in three conversations with your own team.",
    kind: "secret",
    minutes: 15,
    points: 15,
    vibe: ["social", "sneaky"],
    accessibility: ["seated-option", "low-noise-option"],
    equipment: [],
    setup: "Assign privately to one player.",
    prep: "No preparation required.",
    evidenceRequired: true,
    tags: ["Individual"],
  },
  {
    id: "secret-toast",
    title: "The suspicious toast",
    description:
      "Get a teammate to make a dramatic toast without telling them why.",
    kind: "secret",
    minutes: 15,
    points: 15,
    vibe: ["social", "sneaky"],
    accessibility: ["seated-option"],
    equipment: [],
    setup: "Assign privately to one player.",
    prep: "No preparation required.",
    evidenceRequired: true,
    tags: ["Individual"],
  },
];
const defaultForm: SetupForm = {
  name: "",
  eventDate: today(),
  startTime: "18:00",
  idealEndTime: "22:00",
  playerCount: 12,
  gamePhotoUrl: "",
  hostParticipates: true,
  teamsEnabled: true,
  teamSize: null,
  teamSetup: "later",
  accessibility: [],
  ageGroup: "adults",
  alcohol: "no",
  venueName: "",
  venueAddress: "",
  venueNotes: "",
  selectedMain: [],
  selectedSide: ["team-handshake", "team-laugh"],
  selectedSecret: [],
  customTasks: [],
  rewardModes: [],
  decideRewardInGame: true,
  sideChallenges: true,
  secretMissions: false,
  slideshow: true,
  liveFinal: true,
  strictSchedule: false,
  challengeTimers: false,
  autoplay: false,
  whatsappReminders: false,
  autoAssignSecrets: true,
  secretAssignment: "auto",
  preGameTaskId: "",
  preGameEnabled: false,
  inviteBeforeEvent: true,
  demoEnabled: true,
  rules:
    "Be kind, keep challenges safe, respect venue staff and other guests, and don't damage or take anyone's belongings.",
  schedule: [],
  breakMinutes: 15,
  finalDuration: 30,
  secretRevealMode: "scheduled",
  secretRevealAfterMinutes: 30,
};
const accessOptions = [
  "Seated option",
  "Low-noise option",
  "No running",
  "No alcohol",
  "Low sensory load",
  "Mobility-flexible",
  "No public interaction",
];
const vibes = [
  "Silly",
  "Creative",
  "Performance",
  "Social",
  "Competitive",
  "Sneaky",
];
const tabItems: { id: BuilderTab; label: string; description: string }[] = [
  {
    id: "players",
    label: "Players & teams",
    description: "Set team rules and accessibility requirements.",
  },
  {
    id: "main",
    label: "Main Challenges",
    description:
      "Browse and favourite challenges to add to your schedule later.",
  },
  {
    id: "side",
    label: "Side challenges",
    description:
      "Optional tasks; evidence is reviewed and voted on in the live final.",
  },
  {
    id: "secret",
    label: "Secret missions",
    description:
      "Private individual tasks; evidence is required and failed or caught missions earn no points.",
  },
  {
    id: "venue",
    label: "Venue",
    description:
      "Venue details are saved here; advanced venue planning can be added later.",
  },
  {
    id: "controls",
    label: "Game settings",
    description: "Choose reward methods and game behaviour.",
  },
  {
    id: "schedule",
    label: "Schedule",
    description: "Arrange the event timeline and timings.",
  },
  {
    id: "review",
    label: "Review",
    description:
      "Review player activity and submissions once the game is running.",
  },
  {
    id: "invites",
    label: "Invites",
    description: "Set up player invitations and a pre-game challenge.",
  },
  {
    id: "launch",
    label: "Review & Launch",
    description: "Check the plan and prepare to launch.",
  },
];

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="cc-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
function Toggle({
  title,
  detail,
  checked,
  onChange,
}: {
  title: string;
  detail: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="cc-toggle">
      <span>
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <i />
    </label>
  );
}
function timePlus(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m + minutes);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
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
          {stage === "build" ? <Check size={15} /> : "1"}
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
          <Sparkles size={34} />
          <span>CHAOS!</span>
        </div>
        <h3>{form.name || "Your new game"}</h3>
        <ul>
          <li>
            <CalendarDays size={15} />
            {form.eventDate || "Date to be confirmed"}
          </li>
          <li>
            <Users size={15} />
            {form.playerCount} players (target)
          </li>
          <li>
            <MapPin size={15} />
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
        <Sparkles size={17} />
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
            <Sparkles size={16} /> STEP 1 · GAME BASICS
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
                <ImagePlus size={34} />
              )}
            </div>
            <div>
              <strong>Game photo</strong>
              <p>
                Add a photo or graphic to personalise the player welcome screen.
              </p>
              <label className="cc-upload-button">
                <Upload size={15} /> Choose image
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
            className="cc-section-navigation"
            aria-label="Game setup navigation"
          >
            <button type="button" className="cc-secondary" disabled>
              <ArrowLeft size={16} /> Back
            </button>
            <button
              type="button"
              className="cc-primary"
              onClick={goToNextSection}
            >
              Next: Players &amp; Teams <ArrowRight size={17} />
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
                <ArrowLeft size={15} /> Game basics
              </button>
            </div>

            {tab === "players" && (
              <section className="cc-section-card">
                <div className="cc-form-grid">
                  <Field label="Approximate player count">
                    <input
                      type="number"
                      min={2}
                      max={100}
                      value={form.playerCount}
                      onChange={(e) =>
                        update("playerCount", Number(e.target.value))
                      }
                    />
                  </Field>
                  <Field label="Age group">
                    <select
                      value={form.ageGroup}
                      onChange={(e) => update("ageGroup", e.target.value)}
                    >
                      <option value="adults">Adults</option>
                      <option value="under-18">Under 18</option>
                      <option value="mixed">Mixed ages</option>
                    </select>
                  </Field>
                  <Field label="Alcohol at the event">
                    <select
                      value={form.alcohol}
                      onChange={(e) => update("alcohol", e.target.value)}
                    >
                      <option value="no">No alcohol-based tasks</option>
                      <option value="yes">Alcohol is okay</option>
                      <option value="mixed">Keep it optional</option>
                    </select>
                  </Field>
                </div>
                <Toggle
                  title="Host joins the game"
                  detail="You will appear as a player and can complete challenges too."
                  checked={form.hostParticipates}
                  onChange={(v) => update("hostParticipates", v)}
                />
                <Toggle
                  title="Use teams"
                  detail="Players compete in teams instead of individually."
                  checked={form.teamsEnabled}
                  onChange={(v) => update("teamsEnabled", v)}
                />
                {form.teamsEnabled && (
                  <>
                    <Field label="Players per team">
                      <select
                        value={form.teamSize ?? "later"}
                        onChange={(e) =>
                          update(
                            "teamSize",
                            e.target.value === "later"
                              ? null
                              : Number(e.target.value),
                          )
                        }
                      >
                        <option value="later">Decide during the game</option>
                        {[2, 3, 4, 5, 6].map((n) => (
                          <option key={n} value={n}>
                            {n} players
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Who assigns teams?">
                      <select
                        value={form.teamSetup}
                        onChange={(e) =>
                          update(
                            "teamSetup",
                            e.target.value as SetupForm["teamSetup"],
                          )
                        }
                      >
                        <option value="later">Decide during the game</option>
                        <option value="host">Host assigns teams</option>
                        <option value="players">Players choose teams</option>
                      </select>
                    </Field>
                    <div className="cc-explainer">
                      <Users size={18} />
                      <p>
                        If you choose host assignment, you'll pick teams during
                        the game after everyone has joined. You don't need to
                        decide the teams now.
                      </p>
                    </div>
                  </>
                )}
                <Field
                  label="Accessibility requirements"
                  hint="Challenges will be filtered using their accessibility information."
                >
                  <select
                    multiple
                    value={form.accessibility}
                    onChange={(e) =>
                      update(
                        "accessibility",
                        Array.from(e.target.selectedOptions).map(
                          (o) => o.value,
                        ),
                      )
                    }
                  >
                    {accessOptions.map((v, i) => (
                      <option
                        key={v}
                        value={
                          [
                            "seated-option",
                            "low-noise-option",
                            "no-running",
                            "no-alcohol",
                            "low-sensory-load",
                            "mobility-flexible",
                            "no-public-interaction",
                          ][i]
                        }
                      >
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>
              </section>
            )}

            {(tab === "main" || tab === "side" || tab === "secret") && (
              <>
                {tab === "side" && (
                  <div className="cc-explainer">
                    <Info size={18} />
                    <p>
                      <strong>Optional challenges.</strong> Players can complete
                      these alongside the main game. Evidence is required, and
                      submissions are reviewed and voted on during the live
                      final.
                    </p>
                  </div>
                )}
                {tab === "secret" && (
                  <div className="cc-explainer cc-explainer--pink">
                    <ShieldCheck size={18} />
                    <p>
                      <strong>Private individual missions.</strong> Create the
                      missions now; assign them to actual players only after
                      those players have joined the game. Evidence is required.
                    </p>
                  </div>
                )}
                {tab === "main" && (
                  <div className="cc-explainer">
                    <Info size={18} />
                    <p>
                      <strong>Challenge library.</strong> Browse, create and
                      favourite ideas here. Favouriting does not add a challenge
                      to the running order; add it from Schedule when you are
                      ready.
                    </p>
                  </div>
                )}
                <div
                  className={`cc-builder-columns${tab === "main" ? " cc-library-only" : ""}`}
                >
                  {tab !== "main" && (
                    <section className="cc-rounds-panel">
                      <div className="cc-panel-head">
                        <div>
                          <h3>
                            {tab === "side"
                              ? "Selected side challenges"
                              : "Selected secret missions"}
                          </h3>
                          <small>Selected items for this game.</small>
                        </div>
                        <span className="cc-count">{selectedIds.length}</span>
                      </div>
                      {selectedIds.map((taskId, index) => {
                        const task = allTasks.find((t) => t.id === taskId);
                        if (!task) return null;
                        return (
                          <article
                            key={taskId}
                            className="cc-round-card"
                            draggable
                            onDragStart={() => setDragged(taskId)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => dropTask(taskId)}
                          >
                            <GripVertical size={17} className="cc-grip" />
                            <div className="cc-round-number">{index + 1}</div>
                            <span
                              className="cc-round-task-icon"
                              aria-hidden="true"
                            >
                              {challengeIcon(task.title, task.description)}
                            </span>
                            <div className="cc-round-copy">
                              <strong>{task.title}</strong>
                              <small>
                                {tab === "side"
                                  ? `${task.points} pts`
                                  : `${task.minutes} min · ${task.points} pts`}
                                {task.preGame ? " · PRE-GAME" : ""}
                              </small>
                            </div>
                            <div className="cc-round-actions">
                              <button
                                title="Move up"
                                onClick={() => moveTask(taskId, -1)}
                              >
                                <ArrowUp size={14} />
                              </button>
                              <button
                                title="Move down"
                                onClick={() => moveTask(taskId, 1)}
                              >
                                <ArrowDown size={14} />
                              </button>
                            </div>
                            <button
                              className="cc-icon-button"
                              title="Remove"
                              onClick={() => selectTask(task)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </article>
                        );
                      })}
                    </section>
                  )}
                  <section className="cc-library-panel" id="cc-task-library">
                    <div className="cc-panel-head">
                      <div>
                        <h3>Challenge library</h3>
                        <small>
                          Favourite tasks first, then filter and add.
                        </small>
                      </div>
                      <button
                        className={`cc-filter-chip${favouritesOnly ? " active" : ""}`}
                        onClick={() => setFavouritesOnly((v) => !v)}
                      >
                        <Heart size={14} /> Favourites
                      </button>
                    </div>
                    <input
                      className="cc-search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search challenges…"
                    />
                    <div className="cc-filter-row">
                      <select
                        value={vibeFilter}
                        onChange={(e) => setVibeFilter(e.target.value)}
                      >
                        <option value="all">All vibes</option>
                        {vibes.map((v) => (
                          <option key={v} value={v.toLowerCase()}>
                            {v}
                          </option>
                        ))}
                      </select>
                      <select
                        value={accessFilter}
                        onChange={(e) => setAccessFilter(e.target.value)}
                      >
                        <option value="all">All accessibility</option>
                        <option value="seated-option">Seated option</option>
                        <option value="low-noise-option">
                          Low-noise option
                        </option>
                        <option value="no-running">No running</option>
                        <option value="no-alcohol">No alcohol</option>
                        <option value="low-sensory-load">
                          Low sensory load
                        </option>
                        <option value="mobility-flexible">
                          Mobility-flexible
                        </option>
                        <option value="no-public-interaction">
                          No public interaction
                        </option>
                      </select>
                    </div>
                    <div className="cc-task-results">
                      {visibleTasks.map((task) => {
                        const selected = selectedIds.includes(task.id);
                        const saved = favourites.some(
                          (f) =>
                            f.item_type === "task" && f.item_id === task.id,
                        );
                        return (
                          <article
                            className={`cc-task-result${selected ? " selected" : ""}`}
                            key={task.id}
                          >
                            <span
                              className="cc-task-result-icon"
                              aria-hidden="true"
                            >
                              {challengeIcon(task.title, task.description)}
                            </span>
                            <div className="cc-task-result-main">
                              <div className="cc-task-result-title">
                                <strong>{task.title}</strong>
                                <button
                                  className={`cc-heart${saved ? " saved" : ""}`}
                                  onClick={() => void toggleFavourite(task)}
                                  aria-label="Favourite"
                                >
                                  <Heart
                                    size={16}
                                    fill={saved ? "currentColor" : "none"}
                                  />
                                </button>
                              </div>
                              <p>{task.description}</p>
                              <div className="cc-task-tags">
                                {tab !== "side" && (
                                  <span>{task.minutes} min</span>
                                )}
                                <span>{task.points} pts</span>
                                {task.preGame && <span>Pre-game</span>}
                                {task.equipment.length > 0 && (
                                  <span>Equipment</span>
                                )}
                                {task.evidenceRequired && (
                                  <span>Evidence required</span>
                                )}
                              </div>
                            </div>
                            <button
                              className={`cc-select-task${tab === "main" ? (saved ? " selected" : "") : selected ? " selected" : ""}`}
                              onClick={() =>
                                tab === "main"
                                  ? void toggleFavourite(task)
                                  : selectTask(task)
                              }
                            >
                              {tab === "main" ? (
                                saved ? (
                                  <>
                                    <Check size={14} /> Favourited
                                  </>
                                ) : (
                                  <>
                                    <Heart size={14} /> Favourite
                                  </>
                                )
                              ) : selected ? (
                                <>
                                  <Check size={14} /> Added
                                </>
                              ) : (
                                <>
                                  <Plus size={14} /> Add
                                </>
                              )}
                            </button>
                          </article>
                        );
                      })}
                      {!visibleTasks.length && (
                        <p className="cc-muted">
                          No matching challenges. Try changing the filters.
                        </p>
                      )}
                    </div>
                    <form className="cc-custom-task" onSubmit={addCustomTask}>
                      <strong>Create a custom challenge</strong>
                      <input
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="Challenge name"
                      />
                      <input
                        value={customDesc}
                        onChange={(e) => setCustomDesc(e.target.value)}
                        placeholder="Short description"
                      />
                      <button
                        className="cc-secondary"
                        disabled={!customTitle.trim()}
                      >
                        <Plus size={15} /> Add custom challenge
                      </button>
                    </form>
                  </section>
                </div>
              </>
            )}

            {tab === "secret" && (
              <section className="cc-section-card">
                <h3>Mission reveal timing</h3>
                <p>
                  Choose whether reveals happen at a planned point in the game
                  or at a random time.
                </p>
                <Field label="Reveal method">
                  <select
                    value={form.secretRevealMode}
                    onChange={(e) => {
                      const mode = e.target
                        .value as SetupForm["secretRevealMode"];
                      update("secretRevealMode", mode);
                      if (mode === "random")
                        update(
                          "schedule",
                          form.schedule.filter(
                            (item) => item.type !== "secret-reveal",
                          ),
                        );
                      else if (
                        form.selectedSecret.length &&
                        !form.schedule.some(
                          (item) => item.type === "secret-reveal",
                        )
                      )
                        update("schedule", [
                          ...form.schedule,
                          {
                            id: "secret-reveal",
                            type: "secret-reveal",
                            title: "Reveal secret missions",
                            duration: 0,
                          },
                        ]);
                    }}
                  >
                    <option value="scheduled">Scheduled reveal</option>
                    <option value="random">Random reveal</option>
                  </select>
                </Field>
                {form.secretRevealMode === "scheduled" && (
                  <Field label="Reveal after the game starts (minutes)">
                    <input
                      type="number"
                      min={0}
                      max={600}
                      value={form.secretRevealAfterMinutes}
                      onChange={(e) =>
                        update(
                          "secretRevealAfterMinutes",
                          Math.max(0, Number(e.target.value)),
                        )
                      }
                    />
                  </Field>
                )}
                <div className="cc-explainer cc-explainer--pink">
                  <Info size={18} />
                  <p>
                    Player assignment happens after joining, from the host's
                    live game controls. Scheduled reveals are automatically
                    shown in the Schedule; random reveals are not given a fixed
                    slot.
                  </p>
                </div>
              </section>
            )}

            {tab === "venue" && (
              <section className="cc-section-card">
                <div className="cc-explainer">
                  <MapPin size={18} />
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

            {tab === "controls" && (
              <section className="cc-section-card">
                <div className="cc-explainer">
                  <WandSparkles size={18} />
                  <p>
                    <strong>
                      Reward methods are separate from the side-challenge final.
                    </strong>{" "}
                    Choose which methods the host can use for ordinary reward
                    rounds. Side challenges always have their own final vote at
                    the end.
                  </p>
                </div>
                <Toggle
                  title="Decide reward method during the game"
                  detail="Recommended. The host chooses voting, host awards or audience cheers when a reward round happens."
                  checked={form.decideRewardInGame}
                  onChange={(v) => {
                    update("decideRewardInGame", v);
                    if (v) update("rewardModes", []);
                  }}
                />
                {!form.decideRewardInGame && (
                  <div className="cc-reward-options">
                    <p>Enable one or more methods:</p>
                    {(
                      [
                        ["voting", "Player voting"],
                        ["host-awards", "Host awards"],
                        ["audience-cheers", "Audience cheers"],
                      ] as [RewardMode, string][]
                    ).map(([value, label]) => (
                      <label key={value}>
                        <input
                          type="checkbox"
                          checked={form.rewardModes.includes(value)}
                          onChange={(e) =>
                            update(
                              "rewardModes",
                              e.target.checked
                                ? [...form.rewardModes, value]
                                : form.rewardModes.filter((x) => x !== value),
                            )
                          }
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                )}
                <div className="cc-final-required">
                  <CheckCircle2 />
                  <div>
                    <strong>Fan-favourite final vote</strong>
                    <p>
                      {form.sideChallenges
                        ? "Required because side challenges are enabled. It always happens at the end of the game."
                        : "This becomes compulsory automatically if you enable side challenges."}
                    </p>
                  </div>
                  <span>Always on with side challenges</span>
                </div>
                <Toggle
                  title="Side challenges"
                  detail="Optional tasks with evidence, review, slideshow and final voting."
                  checked={form.sideChallenges}
                  onChange={(v) => {
                    update("sideChallenges", v);
                    if (v) {
                      update("liveFinal", true);
                      update("slideshow", true);
                    }
                  }}
                />
                {form.sideChallenges && (
                  <div className="cc-explainer">
                    <Info size={18} />
                    <p>
                      The live final and TV slideshow are automatically enabled.
                      The host gathers everyone around the screen to review
                      side-challenge evidence before the final vote.
                    </p>
                  </div>
                )}
                <Toggle
                  title="Secret missions"
                  detail="Individual private tasks. Every player needs an assigned mission and evidence is required."
                  checked={form.secretMissions}
                  onChange={(v) => update("secretMissions", v)}
                />
                <Toggle
                  title="Strict schedule"
                  detail="Turns on challenge timers and makes the schedule the default running order."
                  checked={form.strictSchedule}
                  onChange={(v) => {
                    update("strictSchedule", v);
                    update("challengeTimers", v);
                  }}
                />
                <Toggle
                  title="Autoplay scheduled rounds"
                  detail="Automatically advance when a timed round finishes."
                  checked={form.autoplay}
                  onChange={(v) => update("autoplay", v)}
                />
              </section>
            )}

            {tab === "schedule" && (
              <section className="cc-section-card">
                <div className="cc-schedule-top">
                  <div>
                    <h3>Event timeline</h3>
                    <p>
                      Breaks are inserted automatically. Change durations or
                      move tasks to adjust the running order.
                    </p>
                  </div>
                  <div className="cc-end-time">
                    <small>Estimated finish</small>
                    <strong>{calculatedEnd}</strong>
                  </div>
                </div>
                <div className="cc-form-grid">
                  <Field label="Default break between challenges">
                    <select
                      value={form.breakMinutes}
                      onChange={(e) =>
                        update("breakMinutes", Number(e.target.value))
                      }
                    >
                      <option value={0}>No break</option>
                      <option value={10}>10 minutes</option>
                      <option value={15}>15 minutes</option>
                      <option value={20}>20 minutes</option>
                      <option value={30}>30 minutes</option>
                    </select>
                  </Field>
                  <Field label="Live final duration">
                    <select
                      value={form.finalDuration}
                      onChange={(e) =>
                        update("finalDuration", Number(e.target.value))
                      }
                    >
                      <option value={20}>20 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                    </select>
                  </Field>
                </div>
                {form.sideChallenges && (
                  <div className="cc-explainer">
                    <Info size={18} />
                    <p>
                      <strong>
                        Final review and rewards add {liveFinalMinutes} minutes.
                      </strong>{" "}
                      {form.finalDuration} minutes for the live final, plus{" "}
                      {sideReviewCount} side-challenge{" "}
                      {sideReviewCount === 1 ? "review" : "reviews"} at 5
                      minutes each. Up to {sideRewardPoints} challenge points
                      are available to award.
                    </p>
                  </div>
                )}
                <div className="cc-schedule-actions">
                  <Field label="Add a challenge">
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) addTaskToSchedule(e.target.value);
                        e.currentTarget.value = "";
                      }}
                    >
                      <option value="">Choose from challenge library…</option>
                      {allTasks
                        .filter((t) => t.kind === "main")
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                    </select>
                  </Field>
                  <button
                    type="button"
                    className="cc-secondary"
                    onClick={() => addScheduleItem("challenge")}
                  >
                    <Plus size={15} /> Create challenge
                  </button>
                  <button
                    type="button"
                    className="cc-secondary"
                    onClick={() => addScheduleItem("break")}
                  >
                    <Plus size={15} /> Add break
                  </button>
                </div>
                <div className="cc-schedule-list">
                  {form.schedule.map((item, index) => {
                    const start = form.schedule
                      .slice(0, index)
                      .reduce((m, x) => m + x.duration, 0);
                    return (
                      <article
                        className={`cc-schedule-item type-${item.type}`}
                        key={item.id}
                        draggable={item.type === "challenge"}
                        onDragStart={() => setDragged(item.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (!dragged || dragged === item.id) return;
                          const a = [...form.schedule];
                          const from = a.findIndex((x) => x.id === dragged);
                          const to = a.findIndex((x) => x.id === item.id);
                          if (from >= 0 && to >= 0) {
                            const [moved] = a.splice(from, 1);
                            a.splice(to, 0, moved);
                            update("schedule", a);
                          }
                          setDragged(null);
                        }}
                      >
                        <div className="cc-schedule-time">
                          <strong>
                            {item.type === "pregame"
                              ? "BEFORE"
                              : timePlus(form.startTime, start)}
                          </strong>
                          <small>
                            {item.type === "pregame"
                              ? "Before arrival"
                              : `${item.duration} min`}
                          </small>
                        </div>
                        <div className="cc-schedule-detail">
                          <span className="cc-schedule-type">
                            {item.type === "teams"
                              ? "TEAM SELECTION"
                              : item.type.toUpperCase()}
                          </span>
                          <>
                            {item.type === "challenge" ? (
                              <input
                                className="cc-schedule-title-edit"
                                aria-label={`Edit ${item.title}`}
                                value={item.title}
                                onChange={(e) =>
                                  updateScheduleItem(item.id, {
                                    title: e.target.value,
                                  })
                                }
                              />
                            ) : (
                              <strong>{item.title}</strong>
                            )}
                            {item.taskId && (
                              <small>
                                {
                                  allTasks.find((t) => t.id === item.taskId)
                                    ?.prep
                                }
                              </small>
                            )}
                            {item.taskId &&
                              !!allTasks.find((t) => t.id === item.taskId)
                                ?.equipment.length && (
                                <small>
                                  Equipment:{" "}
                                  {allTasks
                                    .find((t) => t.id === item.taskId)
                                    ?.equipment.join(", ")}
                                </small>
                              )}
                          </>
                        </div>
                        {item.type !== "pregame" && (
                          <label className="cc-duration-edit">
                            Duration
                            <input
                              type="number"
                              min={1}
                              max={240}
                              value={item.duration}
                              onChange={(e) =>
                                updateScheduleItem(item.id, {
                                  duration: Math.max(1, Number(e.target.value)),
                                })
                              }
                            />
                          </label>
                        )}
                        <button
                          type="button"
                          className="cc-icon-button"
                          title={`Delete ${item.title}`}
                          aria-label={`Delete ${item.title}`}
                          onClick={() => deleteScheduleItem(item.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                        {item.type === "challenge" && (
                          <div className="cc-schedule-move">
                            <button
                              onClick={() => {
                                const next = form.schedule[index - 1];
                                if (next?.type === "challenge") {
                                  const a = [...form.schedule];
                                  [a[index - 1], a[index]] = [
                                    a[index],
                                    a[index - 1],
                                  ];
                                  update("schedule", a);
                                }
                              }}
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              onClick={() => {
                                const next = form.schedule[index + 1];
                                if (next?.type === "challenge") {
                                  const a = [...form.schedule];
                                  [a[index + 1], a[index]] = [
                                    a[index],
                                    a[index + 1],
                                  ];
                                  update("schedule", a);
                                }
                              }}
                            >
                              <ArrowDown size={14} />
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
                <div className="cc-explainer">
                  <Info size={18} />
                  <p>
                    <strong>Flexible schedule.</strong> If a task overruns, the
                    next breaks and challenges can be pushed back automatically.
                    The host can override the schedule during the live game.
                    Enable strict scheduling to turn on challenge timers.
                  </p>
                </div>
                <Toggle
                  title="Follow a strict schedule"
                  detail="Enable countdown timers for timed challenges."
                  checked={form.strictSchedule}
                  onChange={(v) => {
                    update("strictSchedule", v);
                    update("challengeTimers", v);
                  }}
                />
                <Toggle
                  title="Autoplay rounds"
                  detail="Automatically advance when each scheduled task ends."
                  checked={form.autoplay}
                  onChange={(v) => update("autoplay", v)}
                />
                <Toggle
                  title="WhatsApp timing reminders"
                  detail="Prepare timed reminders for players. Automatic sending needs a WhatsApp messaging integration."
                  checked={form.whatsappReminders}
                  onChange={(v) => update("whatsappReminders", v)}
                />
              </section>
            )}

            {tab === "invites" && (
              <section className="cc-section-card">
                <div className="cc-explainer">
                  <Users size={18} />
                  <p>
                    <strong>Invite players before the event.</strong> Players
                    can join early, learn how the app works and see what they
                    need to prepare. The demo uses sample tasks, never your
                    actual game challenges.
                  </p>
                </div>
                <Toggle
                  title="Allow players to join before the event"
                  detail="Create a pre-event player lobby and shareable invite."
                  checked={form.inviteBeforeEvent}
                  onChange={(v) => update("inviteBeforeEvent", v)}
                />
                <Toggle
                  title="Include an app demo"
                  detail="Show a demo video or guided walkthrough using sample challenges."
                  checked={form.demoEnabled}
                  onChange={(v) => update("demoEnabled", v)}
                />
                <Field label="Game rules">
                  <textarea
                    rows={4}
                    value={form.rules}
                    onChange={(e) => update("rules", e.target.value)}
                  />
                </Field>
                <div className="cc-prep-list">
                  <h3>What players need to prepare</h3>
                  {preparation.length ? (
                    preparation.map((t) => (
                      <div key={t.id}>
                        <strong>{t.title}</strong>
                        <p>{t.prep}</p>
                      </div>
                    ))
                  ) : (
                    <p className="cc-muted">
                      No preparation notes yet. Add prep details to a challenge
                      to show them here.
                    </p>
                  )}
                </div>
                <div className="cc-prep-list">
                  <h3>Pre-game challenge</h3>
                  <Toggle
                    title="Add a challenge to complete before arriving"
                    detail="This appears as a main challenge in the player pre-event portal."
                    checked={form.preGameEnabled}
                    onChange={(v) => {
                      update("preGameEnabled", v);
                      if (!v)
                        update(
                          "schedule",
                          form.schedule.filter(
                            (item) =>
                              item.type !== "pregame" &&
                              item.type !== "pregame-review",
                          ),
                        );
                      else if (form.preGameTaskId)
                        setPreGameTask(form.preGameTaskId, true);
                    }}
                  />
                  {form.preGameEnabled && (
                    <>
                      <Field label="Choose pre-game task">
                        <select
                          value={form.preGameTaskId}
                          onChange={(e) => setPreGameTask(e.target.value)}
                        >
                          <option value="">Choose a task</option>
                          {allTasks
                            .filter((t) => t.kind === "main")
                            .map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.title}
                              </option>
                            ))}
                        </select>
                      </Field>
                      <form
                        className="cc-custom-task"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!customTitle.trim()) return;
                          const task: Task = {
                            id: `pregame-${Date.now()}`,
                            title: customTitle.trim(),
                            description:
                              customDesc.trim() ||
                              "Complete this task before arriving.",
                            kind: "main",
                            minutes: 10,
                            points: 10,
                            vibe: ["creative"],
                            accessibility: ["seated-option"],
                            equipment: [],
                            setup: "No special setup.",
                            prep: "Complete before the event.",
                            evidenceRequired: true,
                            preGame: true,
                            tags: ["Pre-game"],
                          };
                          update("customTasks", [...form.customTasks, task]);
                          update("preGameTaskId", task.id);
                          setCustomTitle("");
                          setCustomDesc("");
                          setNotice("Pre-game task created.");
                        }}
                      >
                        <strong>Create a pre-game task</strong>
                        <input
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                          placeholder="Task name"
                        />
                        <input
                          value={customDesc}
                          onChange={(e) => setCustomDesc(e.target.value)}
                          placeholder="What should players do?"
                        />
                        <button
                          className="cc-secondary"
                          disabled={!customTitle.trim()}
                        >
                          <Plus size={15} /> Create pre-game task
                        </button>
                      </form>
                    </>
                  )}
                  <small>
                    Examples: dress most like the host, make the best entrance,
                    or bring the best item. Players can submit before the event;
                    main challenge evidence remains optional unless the host
                    explicitly requests it.
                  </small>
                </div>
                <div className="cc-prep-list">
                  <h3>Secret mission assignment</h3>
                  <p>
                    Missions are created now but recipients are selected only
                    after players have joined. Choose how assignment should work
                    at that point.
                  </p>
                  <Field label="Assignment method">
                    <select
                      value={form.secretAssignment}
                      onChange={(e) =>
                        update(
                          "secretAssignment",
                          e.target.value as "auto" | "host",
                        )
                      }
                    >
                      <option value="auto">
                        Automatically assign after players join
                      </option>
                      <option value="host">
                        Host assigns after players join
                      </option>
                    </select>
                  </Field>
                </div>
                <div className="cc-invite-placeholder">
                  <Info size={18} />
                  <p>
                    The invite portal settings are saved with this plan. A
                    shareable pre-event link is generated when the game session
                    is created; it will show the demo, rules and preparation
                    brief, not the selected challenge library.
                  </p>
                </div>
              </section>
            )}

            {tab === "review" && (
              <section className="cc-section-card">
                <div className="cc-explainer">
                  <Info size={18} />
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
              <section className="cc-section-card">
                <div className="cc-review-hero">
                  <Sparkles size={23} />
                  <div>
                    <small>GAME PLAN</small>
                    <h3>{form.name || "Untitled chaos"}</h3>
                    <p>
                      {form.eventDate} · Starts {form.startTime} · Ideal finish{" "}
                      {form.idealEndTime} · Estimated finish {calculatedEnd}
                    </p>
                  </div>
                </div>
                <div className="cc-review-grid">
                  <div>
                    <Users />
                    <strong>{form.playerCount} players approx.</strong>
                    <small>
                      {form.teamsEnabled
                        ? form.teamSize
                          ? `Teams of ${form.teamSize}`
                          : "Team size decided later"
                        : "Individual play"}
                    </small>
                  </div>
                  <div>
                    <ListChecks />
                    <strong>{selectedMainTasks.length} main challenges</strong>
                    <small>
                      {sideTasks.length} side · {secretTasks.length} secret
                    </small>
                  </div>
                  <div>
                    <CalendarDays />
                    <strong>{form.schedule.length} schedule items</strong>
                    <small>
                      {form.strictSchedule
                        ? "Strict timers on"
                        : "Flexible timing"}
                    </small>
                  </div>
                  <div>
                    <MapPin />
                    <strong>{form.venueName || "Venue TBC"}</strong>
                    <small>{form.venueAddress || "Address not added"}</small>
                  </div>
                </div>
                <div className="cc-review-block">
                  <h3>Equipment list</h3>
                  {equipment.length ? (
                    <ul>
                      {equipment.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No specific equipment listed.</p>
                  )}
                </div>
                <div className="cc-review-block">
                  <h3>Preparation for players</h3>
                  {preparation.length ? (
                    preparation.map((t) => (
                      <p key={t.id}>
                        <strong>{t.title}:</strong> {t.prep}
                      </p>
                    ))
                  ) : (
                    <p>No advance preparation required.</p>
                  )}
                </div>
                <div className="cc-review-block">
                  <h3>Reward methods</h3>
                  <p>
                    {form.decideRewardInGame
                      ? "Host decides during the game"
                      : form.rewardModes.length
                        ? form.rewardModes.join(", ")
                        : "No reward method selected"}
                  </p>
                  <p>
                    {form.sideChallenges
                      ? "Compulsory live final, slideshow and fan-favourite vote enabled."
                      : "No side-challenge final required."}
                  </p>
                </div>
                <div className="cc-explainer">
                  <ShieldCheck size={18} />
                  <p>
                    Saving a plan does not launch the game. Player invitations
                    and the pre-event portal become available when a session is
                    created from this plan.
                  </p>
                </div>
                <div className="cc-explainer">
                  <Play size={18} />
                  <p>
                    <strong>Host game demo</strong>
                    <br />
                    The current project has a live-session player preview, but
                    not a safe standalone demo route. I have not linked this
                    button to a real session because that would create a live
                    game rather than a demo.
                  </p>
                </div>
              </section>
            )}

            <nav
              className="cc-section-navigation"
              aria-label="Game setup navigation"
            >
              <button
                type="button"
                className="cc-secondary"
                onClick={goToPreviousSection}
              >
                <ArrowLeft size={16} /> Back
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
                    <ArrowRight size={16} />
                  ) : (
                    <CheckCircle2 size={16} />
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
