import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3, Heart, MapPin, Plus, ShieldCheck, Sparkles, Users } from "lucide-react";
import { supabase } from "../lib/supabase";
import HostShell from "../components/host/HostShell";
import "../styles/HostPortal.css";

type StepId = "overview" | "players" | "venue" | "challenges" | "controls" | "review";
type TaskKind = "main" | "side" | "secret";
type Task = { id: string; title: string; description: string; points: number; minutes: number; kind: TaskKind; tags: string[] };
type Fav = { id: string; item_type: "task" | "venue"; item_id: string };

interface PlanForm {
  name: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  vibe: string;
  playerCount: number;
  hostParticipates: boolean;
  teamsEnabled: boolean;
  hostChoosesTeams: boolean;
  teamSize: number;
  ageGroup: string;
  alcohol: string;
  accessibilityNotes: string;
  venueName: string;
  venueAddress: string;
  venueType: string;
  venueBooking: string;
  sideChallenges: boolean;
  secretMissions: boolean;
  sabotage: boolean;
  evidenceRequired: boolean;
  setupEffort: string;
  equipmentPreference: string;
  voting: boolean;
  votingTiming: string;
  liveFinal: boolean;
  slideshow: boolean;
  taskTimers: boolean;
  playerReadyCheck: boolean;
  selectedTaskIds: string[];
  customTasks: Task[];
}

const taskLibrary: Task[] = [
  { id: "task-best-thing", title: "Obtain the best thing", description: "Find or make the best small object you can using only what's available at the venue. Present your case to the host.", points: 25, minutes: 15, kind: "main", tags: ["indoors", "improv", "no prep"] },
  { id: "task-best-noise", title: "Make the best noise", description: "Create a noise that will make the host laugh. No shouting at strangers or disrupting other guests.", points: 15, minutes: 5, kind: "main", tags: ["quick", "performance"] },
  { id: "task-human-statue", title: "Become a human statue", description: "As a team, make the most convincing statue of a famous landmark or a very confusing situation.", points: 20, minutes: 8, kind: "main", tags: ["team", "photo"] },
  { id: "task-party-ad", title: "Advertise this party", description: "Make a 15-second advert for the party using three random words chosen by the host.", points: 20, minutes: 10, kind: "main", tags: ["video", "team"] },
  { id: "task-portrait", title: "Draw the host", description: "Draw the host with your non-dominant hand. The host judges the results.", points: 15, minutes: 8, kind: "main", tags: ["creative", "equipment helpful"] },
  { id: "task-paper-tower", title: "The tallest tiny tower", description: "Build the tallest freestanding tower from the items the host supplies. Keep it safe and easy to clear away.", points: 20, minutes: 10, kind: "main", tags: ["equipment", "team"] },
  { id: "task-secret-toast", title: "The suspicious toast", description: "Get a teammate to make a dramatic toast without telling them why.", points: 10, minutes: 10, kind: "side", tags: ["secret", "social"] },
  { id: "task-secret-word", title: "Sneak in the word", description: "Use the word 'pineapple' naturally in three conversations with your own team.", points: 10, minutes: 15, kind: "side", tags: ["secret", "no prep"] },
  { id: "task-team-laugh", title: "Make your team laugh", description: "Make every teammate laugh without touching them or using your phone.", points: 10, minutes: 5, kind: "side", tags: ["quick", "team"] },
  { id: "task-handshake", title: "Invent a secret handshake", description: "Create and perform a team handshake that lasts exactly five seconds.", points: 10, minutes: 10, kind: "side", tags: ["team", "performance"] },
  { id: "task-secret-mission", title: "Secret mission", description: "Complete a discreet, harmless mission without telling the other teams what it is.", points: 15, minutes: 20, kind: "secret", tags: ["secret", "sneaky"] },
  { id: "task-sabotage", title: "Friendly sabotage", description: "Give another team a ridiculous distraction using only words. No hiding, damaging or taking their belongings.", points: 10, minutes: 10, kind: "secret", tags: ["silly", "social"] },
];

const today = () => {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const initialForm: PlanForm = {
  name: "",
  eventDate: today(),
  startTime: "18:00",
  endTime: "22:00",
  vibe: "chaotic",
  playerCount: 12,
  hostParticipates: true,
  teamsEnabled: true,
  hostChoosesTeams: false,
  teamSize: 4,
  ageGroup: "adults",
  alcohol: "no",
  accessibilityNotes: "",
  venueName: "",
  venueAddress: "",
  venueType: "private-room",
  venueBooking: "already-booked",
  sideChallenges: true,
  secretMissions: false,
  sabotage: false,
  evidenceRequired: false,
  setupEffort: "medium",
  equipmentPreference: "basic",
  voting: true,
  votingTiming: "after-challenges",
  liveFinal: true,
  slideshow: false,
  taskTimers: true,
  playerReadyCheck: true,
  selectedTaskIds: ["task-best-thing", "task-best-noise", "task-human-statue", "task-party-ad", "task-secret-toast", "task-team-laugh"],
  customTasks: [],
};

const steps: { id: StepId; title: string; label: string; helper: string }[] = [
  { id: "overview", title: "Let's set the scene", label: "Overview", helper: "The basics of your event." },
  { id: "players", title: "Who's playing?", label: "Players", helper: "Set up your group and teams." },
  { id: "venue", title: "One venue. Maximum chaos.", label: "Venue", helper: "This version stays in one place." },
  { id: "challenges", title: "Choose your challenges", label: "Challenges", helper: "Mix main rounds with optional side missions." },
  { id: "controls", title: "Make it your game", label: "Game controls", helper: "Choose how the game runs." },
  { id: "review", title: "Ready to cause trouble?", label: "Review", helper: "Check everything before saving your plan." },
];

function ChoicePill({ selected, children, onClick }: { selected: boolean; children: ReactNode; onClick: () => void }) {
  return <button type="button" className={`host-choice-pill${selected ? " is-selected" : ""}`} aria-pressed={selected} onClick={onClick}>{children}</button>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="host-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export default function HostPlanSetup() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = Boolean(id);
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<PlanForm>(initialForm);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState<"all" | TaskKind>("all");
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [favourites, setFavourites] = useState<Fav[]>([]);
  const currentStep = steps[stepIndex];

  const update = <K extends keyof PlanForm>(key: K, value: PlanForm[K]) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        if (active) { setError("Your host session has expired. Please log in again."); setLoading(false); }
        return;
      }

      const { data: favData } = await supabase.from("host_favourites").select("id, item_type, item_id").eq("host_id", authData.user.id);
      if (active) setFavourites((favData ?? []) as Fav[]);

      if (!id) { if (active) setLoading(false); return; }
      const { data, error: loadError } = await supabase.from("host_games").select("*").eq("id", id).eq("host_id", authData.user.id).maybeSingle();
      if (!active) return;
      if (loadError || !data) {
        setError("Couldn't find that game plan. It may have been deleted or belong to another account.");
        setLoading(false);
        return;
      }
      const raw = (data.plan_data ?? {}) as Partial<PlanForm>;
      setForm({
        ...initialForm,
        ...raw,
        name: String(data.name ?? raw.name ?? ""),
        eventDate: String(data.event_date ?? raw.eventDate ?? today()),
        startTime: String(data.start_time ?? raw.startTime ?? "18:00").slice(0, 5),
        endTime: String(data.end_time ?? raw.endTime ?? "22:00").slice(0, 5),
        playerCount: Number(data.player_count ?? raw.playerCount ?? 12),
        venueName: String(data.venue_name ?? raw.venueName ?? ""),
        selectedTaskIds: Array.isArray(raw.selectedTaskIds) ? raw.selectedTaskIds : initialForm.selectedTaskIds,
        customTasks: Array.isArray(raw.customTasks) ? raw.customTasks : [],
      });
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [id]);

  const tasks = useMemo(() => [...taskLibrary, ...form.customTasks], [form.customTasks]);
  const visibleTasks = tasks.filter((task) => filter === "all" || task.kind === filter).filter((task) => {
    if (task.kind === "side" && !form.sideChallenges) return false;
    if (task.kind === "secret" && !form.secretMissions && !form.sabotage) return false;
    if (task.id === "task-sabotage" && !form.sabotage) return false;
    return true;
  });
  const selectedTasks = tasks.filter((task) => form.selectedTaskIds.includes(task.id));

  function toggleTask(taskId: string) {
    update("selectedTaskIds", form.selectedTaskIds.includes(taskId) ? form.selectedTaskIds.filter((id) => id !== taskId) : [...form.selectedTaskIds, taskId]);
  }

  async function toggleFavourite(task: Task) {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) { setError("Please log in again."); return; }
    const existing = favourites.find((fav) => fav.item_type === "task" && fav.item_id === task.id);
    if (existing) {
      const { error: deleteError } = await supabase.from("host_favourites").delete().eq("id", existing.id);
      if (deleteError) { setError(deleteError.message); return; }
      setFavourites((current) => current.filter((fav) => fav.id !== existing.id));
    } else {
      const { data, error: insertError } = await supabase.from("host_favourites").insert({
        host_id: authData.user.id, item_type: "task", item_id: task.id,
        item_data: { title: task.title, description: task.description, points: task.points, minutes: task.minutes, kind: task.kind, tags: task.tags },
      }).select("id, item_type, item_id").single();
      if (insertError) { setError(insertError.message); return; }
      if (data) setFavourites((current) => [...current, data as Fav]);
    }
  }

  async function toggleVenueFavourite() {
    const venueName = form.venueName.trim();
    if (!venueName) {
      setError("Enter a venue name before saving it.");
      return;
    }
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setError("Please log in again.");
      return;
    }
    const itemId = venueName.toLowerCase().replace(/\\s+/g, "-");
    const existing = favourites.find((fav) => fav.item_type === "venue" && fav.item_id === itemId);
    if (existing) {
      const { error: deleteError } = await supabase.from("host_favourites").delete().eq("id", existing.id);
      if (deleteError) { setError(deleteError.message); return; }
      setFavourites((current) => current.filter((fav) => fav.id !== existing.id));
      setNotice("Venue removed from saved items.");
      return;
    }
    const { data, error: insertError } = await supabase.from("host_favourites").insert({
      host_id: authData.user.id,
      item_type: "venue",
      item_id: itemId,
      item_data: { name: venueName, venueType: form.venueType, address: form.venueAddress.trim() || null },
    }).select("id, item_type, item_id").single();
    if (insertError) { setError(insertError.message); return; }
    if (data) setFavourites((current) => [...current, data as Fav]);
    setNotice("Venue saved to your favourites.");
  }

  function addCustomTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = customTitle.trim();
    if (!title) return;
    const newTask: Task = {
      id: `custom-${Date.now()}`,
      title,
      description: customDescription.trim() || "Custom challenge created by the host.",
      points: 10,
      minutes: 10,
      kind: filter === "side" ? "side" : filter === "secret" ? "secret" : "main",
      tags: ["custom"],
    };
    update("customTasks", [...form.customTasks, newTask]);
    update("selectedTaskIds", [...form.selectedTaskIds, newTask.id]);
    setCustomTitle("");
    setCustomDescription("");
    setNotice("Custom challenge added to your plan.");
  }

  function validateCurrent(): string {
    if (currentStep.id === "overview") {
      if (!form.name.trim()) return "Give your game a name.";
      if (!form.eventDate) return "Choose the date of your event.";
      if (form.endTime <= form.startTime) return "The end time needs to be later than the start time.";
    }
    if (currentStep.id === "players" && (form.playerCount < 2 || form.playerCount > 100)) return "Choose between 2 and 100 players.";
    if (currentStep.id === "venue" && !form.venueName.trim()) return "Add the name of your venue.";
    if (currentStep.id === "challenges" && selectedTasks.length === 0) return "Choose at least one challenge.";
    return "";
  }

  async function savePlan(status: "draft" | "planned") {
    const validationError = status === "planned" ? validateAll() : "";
    if (validationError) { setError(validationError); setStepIndex(steps.findIndex((step) => step.id === (validationError.includes("venue") ? "venue" : validationError.includes("challenge") ? "challenges" : validationError.includes("players") ? "players" : "overview"))); return; }
    setSaving(true);
    setError("");
    setNotice("");
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setSaving(false);
      setError("Your host session expired. Log in again before saving.");
      return;
    }
    const planData = {
      version: 1,
      ...form,
      selectedTasks,
      locationMode: "single-venue",
      noVenueChanges: true,
    };
    const payload = {
      name: form.name.trim() || "Untitled chaos",
      host_id: authData.user.id,
      event_date: form.eventDate || null,
      start_time: form.startTime || null,
      end_time: form.endTime || null,
      player_count: Number(form.playerCount),
      venue_name: form.venueName.trim() || null,
      status,
      plan_data: planData,
    };

    let savedId = id;
    let saveError: Error | null = null;
    if (id) {
      const { error: updateError } = await supabase.from("host_games").update({
        name: payload.name, event_date: payload.event_date, start_time: payload.start_time, end_time: payload.end_time,
        player_count: payload.player_count, venue_name: payload.venue_name, status, plan_data: payload.plan_data,
      }).eq("id", id).eq("host_id", authData.user.id);
      if (updateError) saveError = updateError;
    } else {
      const { data, error: insertError } = await supabase.from("host_games").insert(payload).select("id").single();
      if (insertError) saveError = insertError;
      else savedId = data?.id ? String(data.id) : undefined;
    }
    setSaving(false);
    if (saveError || !savedId) {
      console.error("SAVE HOST PLAN ERROR", saveError);
      setError(saveError?.message ?? "The plan couldn't be saved. Try again.");
      return;
    }
    if (status === "draft") {
      setNotice("Draft saved.");
      if (!id) navigate(`/host/games/${savedId}/edit`, { replace: true });
    } else {
      navigate("/host?created=1", { replace: true });
    }
  }

  function validateAll(): string {
    if (!form.name.trim()) return "Give your game a name.";
    if (!form.eventDate) return "Choose the date of your event.";
    if (form.endTime <= form.startTime) return "The end time needs to be later than the start time.";
    if (form.playerCount < 2 || form.playerCount > 100) return "Choose between 2 and 100 players.";
    if (!form.venueName.trim()) return "Add the name of your venue.";
    if (selectedTasks.length === 0) return "Choose at least one challenge.";
    return "";
  }

  const next = () => {
    const problem = validateCurrent();
    if (problem) { setError(problem); return; }
    setError("");
    setNotice("");
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => { setError(""); setNotice(""); if (stepIndex === 0) navigate("/host"); else setStepIndex((current) => current - 1); window.scrollTo({ top: 0, behavior: "smooth" }); };

  if (loading) return <HostShell title={editing ? "Edit game plan" : "Create a game"} subtitle="Getting your plan ready…" showCreate={false}><div className="host-empty-state">Loading your plan…</div></HostShell>;

  return (
    <HostShell title={editing ? "Edit your game plan" : "Plan a new game"} subtitle="A few choices now. A lot of chaos later." showCreate={false}>
      <div className="host-plan-layout">
        <aside className="host-plan-steps">
          <div className="host-plan-steps-title">YOUR GAME PLAN</div>
          {steps.map((step, index) => <button key={step.id} type="button" className={`host-plan-step${index === stepIndex ? " is-active" : ""}${index < stepIndex ? " is-done" : ""}`} onClick={() => { if (index < stepIndex) { setStepIndex(index); setError(""); } }}>
            <span className="host-plan-step-number">{index < stepIndex ? <Check size={16}/> : index + 1}</span>
            <span><strong>{step.label}</strong><small>{step.helper}</small></span>
          </button>)}
          <div className="host-single-venue-note"><MapPin size={19}/><div><strong>Stationary party mode</strong><p>Your guests stay in one venue. No pub crawl or route planning required.</p></div></div>
        </aside>

        <section className="host-plan-card">
          <div className="host-plan-card-heading"><span className="host-eyebrow">STEP {stepIndex + 1} OF {steps.length}</span><h2>{currentStep.title}</h2><p>{currentStep.helper}</p></div>
          {error && <div className="host-alert host-alert--error" role="alert">{error}</div>}
          {notice && <div className="host-alert host-alert--success" role="status">{notice}</div>}

          {currentStep.id === "overview" && <div className="host-form host-plan-form">
            <Field label="Name your game"><input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Iona's birthday chaos" required /></Field>
            <div className="host-two-cols">
              <Field label="Game date"><input type="date" min={today()} value={form.eventDate} onChange={(e) => update("eventDate", e.target.value)} required /></Field>
              <Field label="Vibe"><select value={form.vibe} onChange={(e) => update("vibe", e.target.value)}><option value="chaotic">Chaotic & ridiculous</option><option value="competitive">Competitive</option><option value="chilled">Chilled & social</option><option value="creative">Creative</option><option value="wild">Unpredictable</option></select></Field>
              <Field label="Start time"><input type="time" value={form.startTime} onChange={(e) => update("startTime", e.target.value)} required /></Field>
              <Field label="End time"><input type="time" value={form.endTime} onChange={(e) => update("endTime", e.target.value)} required /></Field>
            </div>
          </div>}

          {currentStep.id === "players" && <div className="host-form host-plan-form">
            <Field label="How many people are playing?" hint="Include yourself if you plan to play."><input type="number" min={2} max={100} value={form.playerCount} onChange={(e) => update("playerCount", Number(e.target.value))} /></Field>
            <div className="host-plan-option"><div><strong>Host joins the game</strong><p>You'll compete alongside everyone else.</p></div><button type="button" role="switch" aria-checked={form.hostParticipates} className={`host-switch${form.hostParticipates ? " is-on" : ""}`} onClick={() => update("hostParticipates", !form.hostParticipates)}><span/></button></div>
            <div className="host-plan-option"><div><strong>Use teams</strong><p>Players compete in teams rather than individually.</p></div><button type="button" role="switch" aria-checked={form.teamsEnabled} className={`host-switch${form.teamsEnabled ? " is-on" : ""}`} onClick={() => update("teamsEnabled", !form.teamsEnabled)}><span/></button></div>
            {form.teamsEnabled && <>
              <Field label="Players per team"><select value={form.teamSize} onChange={(e) => update("teamSize", Number(e.target.value))}><option value={2}>2 players</option><option value={3}>3 players</option><option value={4}>4 players</option><option value={5}>5 players</option><option value={6}>6 players</option></select></Field>
              <div className="host-plan-option"><div><strong>Host assigns teams</strong><p>Choose teams for everyone from the host dashboard.</p></div><button type="button" role="switch" aria-checked={form.hostChoosesTeams} className={`host-switch${form.hostChoosesTeams ? " is-on" : ""}`} onClick={() => update("hostChoosesTeams", !form.hostChoosesTeams)}><span/></button></div>
            </>}
            <div className="host-two-cols">
              <Field label="Player age group"><select value={form.ageGroup} onChange={(e) => update("ageGroup", e.target.value)}><option value="adults">Over 18</option><option value="under-18">Under 18</option><option value="mixed">Mixed ages</option></select></Field>
              <Field label="Alcohol at the event?"><select value={form.alcohol} onChange={(e) => update("alcohol", e.target.value)}><option value="no">No alcohol-based tasks</option><option value="yes">Alcohol is okay</option><option value="mixed">Keep it optional</option></select></Field>
            </div>
            <Field label="Accessibility or inclusion notes" hint="Optional. Used to help you pick suitable challenges."><textarea rows={3} value={form.accessibilityNotes} onChange={(e) => update("accessibilityNotes", e.target.value)} placeholder="e.g. seated alternatives, low-noise activities…" /></Field>
          </div>}

          {currentStep.id === "venue" && <div className="host-form host-plan-form">
            <div className="host-info-banner"><MapPin size={20}/><div><strong>One fixed location</strong><p>We'll plan rounds and timings around this venue. Guests won't need to travel between locations.</p></div></div>
            <Field label="Venue name"><input value={form.venueName} onChange={(e) => update("venueName", e.target.value)} placeholder="e.g. The function room" required /></Field>
            <Field label="Venue address (optional)"><input value={form.venueAddress} onChange={(e) => update("venueAddress", e.target.value)} placeholder="Street, town or a private address" /></Field>
            <div className="host-venue-favourite-row">
              <span className="host-muted">Save this venue to your host favourites.</span>
              <button type="button" className={`host-button host-button--secondary${favourites.some((fav) => fav.item_type === "venue" && fav.item_id === form.venueName.trim().toLowerCase().replace(/\\s+/g, "-")) ? " is-favourited" : ""}`} onClick={() => void toggleVenueFavourite()} disabled={!form.venueName.trim()}>
                <Heart size={16} fill={favourites.some((fav) => fav.item_type === "venue" && fav.item_id === form.venueName.trim().toLowerCase().replace(/\\s+/g, "-")) ? "currentColor" : "none"} />
                {favourites.some((fav) => fav.item_type === "venue" && fav.item_id === form.venueName.trim().toLowerCase().replace(/\\s+/g, "-")) ? "Saved venue" : "Save venue"}
              </button>
            </div>
            <div className="host-two-cols">
              <Field label="What kind of space?"><select value={form.venueType} onChange={(e) => update("venueType", e.target.value)}><option value="private-room">Private / function room</option><option value="home">Someone's home</option><option value="pub">Pub or bar</option><option value="garden">Garden / outdoor space</option><option value="hall">Community hall</option><option value="other">Other</option></select></Field>
              <Field label="Booking status"><select value={form.venueBooking} onChange={(e) => update("venueBooking", e.target.value)}><option value="already-booked">Already booked</option><option value="need-to-book">Need to book</option><option value="private">Private venue</option><option value="free">No booking needed</option></select></Field>
            </div>
            <div className="host-muted-panel"><ShieldCheck size={18}/><p>This planner won't suggest a route or add extra stops. You can still create different rounds, timed challenges and a grand final at the same venue.</p></div>
          </div>}

          {currentStep.id === "challenges" && <div className="host-plan-form">
            <div className="host-plan-option"><div><strong>Side challenges</strong><p>Optional missions players can complete between rounds.</p></div><button type="button" role="switch" aria-checked={form.sideChallenges} className={`host-switch${form.sideChallenges ? " is-on" : ""}`} onClick={() => update("sideChallenges", !form.sideChallenges)}><span/></button></div>
            <div className="host-plan-option"><div><strong>Secret missions</strong><p>Give players hidden objectives during the party.</p></div><button type="button" role="switch" aria-checked={form.secretMissions} className={`host-switch${form.secretMissions ? " is-on" : ""}`} onClick={() => update("secretMissions", !form.secretMissions)}><span/></button></div>
            <div className="host-plan-option"><div><strong>Friendly sabotage</strong><p>Allow harmless distractions between teams.</p></div><button type="button" role="switch" aria-checked={form.sabotage} className={`host-switch${form.sabotage ? " is-on" : ""}`} onClick={() => update("sabotage", !form.sabotage)}><span/></button></div>
            <div className="host-plan-option"><div><strong>Evidence required</strong><p>Ask players to upload a photo or video to prove completion.</p></div><button type="button" role="switch" aria-checked={form.evidenceRequired} className={`host-switch${form.evidenceRequired ? " is-on" : ""}`} onClick={() => update("evidenceRequired", !form.evidenceRequired)}><span/></button></div>
            <div className="host-two-cols">
              <Field label="Setup effort"><select value={form.setupEffort} onChange={(e) => update("setupEffort", e.target.value)}><option value="low">Low prep</option><option value="medium">A little prep</option><option value="high">Big production</option></select></Field>
              <Field label="Equipment"><select value={form.equipmentPreference} onChange={(e) => update("equipmentPreference", e.target.value)}><option value="none">No equipment</option><option value="basic">Basic props</option><option value="anything">Anything goes</option></select></Field>
            </div>
            <div className="host-task-library-header"><div><h3>Pick your challenges</h3><p>{selectedTasks.length} selected · defaults are a starting point, not a commitment.</p></div><div className="host-task-filters">{(["all", "main", "side", "secret"] as const).map((kind) => <ChoicePill key={kind} selected={filter === kind} onClick={() => setFilter(kind)}>{kind === "all" ? "All" : kind === "main" ? "Main" : kind === "side" ? "Side" : "Secret"}</ChoicePill>)}</div></div>
            <div className="host-task-list">
              {visibleTasks.map((task) => {
                const selected = form.selectedTaskIds.includes(task.id);
                const saved = favourites.some((fav) => fav.item_type === "task" && fav.item_id === task.id);
                return <article className={`host-task-card${selected ? " is-selected" : ""}`} key={task.id}>
                  <button type="button" className={`host-task-select${selected ? " is-selected" : ""}`} aria-pressed={selected} onClick={() => toggleTask(task.id)}>{selected ? <Check size={16}/> : <Plus size={16}/>}</button>
                  <div className="host-task-copy"><div className="host-task-title-row"><h4>{task.title}</h4><span className="host-tag">+{task.points} pts</span></div><p>{task.description}</p><div className="host-task-meta"><span><Clock3 size={13}/>{task.minutes} min</span><span className="host-tag">{task.kind}</span>{task.tags.slice(0, 2).map((tag) => <span className="host-task-tag" key={tag}>{tag}</span>)}</div></div>
                  <button type="button" className={`host-favourite-button${saved ? " is-saved" : ""}`} title={saved ? "Remove from saved" : "Save challenge"} aria-label={saved ? `Unsave ${task.title}` : `Save ${task.title}`} onClick={() => void toggleFavourite(task)}><Heart size={18} fill={saved ? "currentColor" : "none"}/></button>
                </article>;
              })}
              {!visibleTasks.length && <p className="host-muted">No challenges in this filter. Enable that task type above, or add a custom challenge below.</p>}
            </div>
            <form className="host-custom-task-form" onSubmit={addCustomTask}>
              <h3>Create a custom challenge</h3>
              <div className="host-two-cols"><input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder="Challenge name" aria-label="Challenge name" /><input value={customDescription} onChange={(e) => setCustomDescription(e.target.value)} placeholder="Short description (optional)" aria-label="Challenge description" /></div>
              <button className="host-button host-button--secondary" type="submit" disabled={!customTitle.trim()}><Plus size={16}/> Add challenge</button>
            </form>
          </div>}

          {currentStep.id === "controls" && <div className="host-form host-plan-form">
            <div className="host-plan-option"><div><strong>Voting</strong><p>Let players vote on selected challenges or the grand final.</p></div><button type="button" role="switch" aria-checked={form.voting} className={`host-switch${form.voting ? " is-on" : ""}`} onClick={() => update("voting", !form.voting)}><span/></button></div>
            {form.voting && <Field label="When should voting happen?"><select value={form.votingTiming} onChange={(e) => update("votingTiming", e.target.value)}><option value="after-challenges">After each challenge</option><option value="live-final">During the live final</option><option value="end">At the end of the game</option></select></Field>}
            <div className="host-plan-option"><div><strong>Live final</strong><p>Finish with a host-led final challenge.</p></div><button type="button" role="switch" aria-checked={form.liveFinal} className={`host-switch${form.liveFinal ? " is-on" : ""}`} onClick={() => update("liveFinal", !form.liveFinal)}><span/></button></div>
            <div className="host-plan-option"><div><strong>Slideshow at the end</strong><p>Show the best photos and moments on a shared screen.</p></div><button type="button" role="switch" aria-checked={form.slideshow} className={`host-switch${form.slideshow ? " is-on" : ""}`} onClick={() => update("slideshow", !form.slideshow)}><span/></button></div>
            <div className="host-plan-option"><div><strong>Challenge timers</strong><p>Give timed tasks a visible countdown.</p></div><button type="button" role="switch" aria-checked={form.taskTimers} className={`host-switch${form.taskTimers ? " is-on" : ""}`} onClick={() => update("taskTimers", !form.taskTimers)}><span/></button></div>
            <div className="host-plan-option"><div><strong>Player ready check</strong><p>Confirm the group is ready before starting.</p></div><button type="button" role="switch" aria-checked={form.playerReadyCheck} className={`host-switch${form.playerReadyCheck ? " is-on" : ""}`} onClick={() => update("playerReadyCheck", !form.playerReadyCheck)}><span/></button></div>
          </div>}

          {currentStep.id === "review" && <div className="host-review-summary">
            <div className="host-review-hero"><Sparkles size={24}/><div><span className="host-eyebrow host-eyebrow--light">YOUR PLAN</span><h3>{form.name || "Untitled chaos"}</h3><p>{dateLabelForReview(form.eventDate)} · {form.startTime}–{form.endTime}</p></div></div>
            <div className="host-review-grid">
              <div className="host-review-item"><Users size={19}/><div><small>Players</small><strong>{form.playerCount} people</strong><span>{form.teamsEnabled ? `Teams of ${form.teamSize}` : "Individual play"}</span></div></div>
              <div className="host-review-item"><MapPin size={19}/><div><small>Fixed venue</small><strong>{form.venueName}</strong><span>{form.venueAddress || "Address not added"}</span></div></div>
              <div className="host-review-item"><Sparkles size={19}/><div><small>Challenges</small><strong>{selectedTasks.length} selected</strong><span>{form.sideChallenges ? "Side challenges on" : "Main challenges only"}</span></div></div>
              <div className="host-review-item"><Clock3 size={19}/><div><small>Approx. duration</small><strong>{durationLabel(form.startTime, form.endTime)}</strong><span>{form.taskTimers ? "Challenge timers on" : "No timers"}</span></div></div>
            </div>
            <div className="host-review-tasks"><h3>Your challenge list</h3>{selectedTasks.map((task, index) => <div className="host-review-task" key={task.id}><span>{String(index + 1).padStart(2,"0")}</span><div><strong>{task.title}</strong><small>{task.kind} · {task.minutes} min · {task.points} points</small></div></div>)}</div>
            <div className="host-info-banner"><ShieldCheck size={20}/><div><strong>Ready to save this plan?</strong><p>This saves your settings and challenge selection to your host account. Live-game launch is a separate step; it won't start the game or notify players yet.</p></div></div>
          </div>}

          <div className="host-plan-footer">
            <button type="button" className="host-button host-button--ghost" onClick={back}><ArrowLeft size={17}/>{stepIndex === 0 ? "Cancel" : "Back"}</button>
            <div className="host-plan-footer-right">
              <button type="button" className="host-button host-button--secondary" onClick={() => void savePlan("draft")} disabled={saving}>{saving ? "Saving…" : "Save draft"}</button>
              {stepIndex < steps.length - 1 ? <button type="button" className="host-button host-button--primary" onClick={next}>Continue <ArrowRight size={17}/></button> : <button type="button" className="host-button host-button--primary" disabled={saving} onClick={() => void savePlan("planned")}>{saving ? "Saving…" : "Save game plan"} <CheckCircle2 size={17}/></button>}
            </div>
          </div>
        </section>
      </div>
    </HostShell>
  );
}

function dateLabelForReview(value: string) {
  if (!value) return "Date TBC";
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}
function durationLabel(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 1440;
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainder = mins % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}
