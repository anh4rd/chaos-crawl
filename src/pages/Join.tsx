import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import imageCompression from "browser-image-compression";
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  Clock3,
  Flag,
  LockKeyhole,
  Plus,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { usePlayers } from "../game/hooks/usePlayers";
import { getPlayerId, setPlayerId } from "../lib/playerSession";
import { supabase } from "../lib/supabase";
import "../styles/JoinFlow.css";

type JoinStep = "code" | "details" | "team" | "team-name" | "waiting";

type GameJoinInfo = {
  id: number;
  join_code: string;
  event_name: string;
  event_image_url: string | null;
  join_open: boolean;
  game_status: "lobby" | "live" | "finished";
};

type JoinPlayer = {
  id: string;
  name: string;
  team: string | null;
  score?: number | null;
  phone?: string | null;
  avatar_url?: string | null;
  is_ready?: boolean;
};

type JoinTeam = {
  id: string | number;
  name: string;
  avatar_url?: string | null;
};

const MAX_TEAM_SIZE = 4;
const EVENT_FALLBACK = "Birthday Chaos";
const PLAYER_DRAFT_KEY = "chaos-crawl-join-draft";

function readDraft(): { name?: string; phone?: string } {
  try {
    return JSON.parse(sessionStorage.getItem(PLAYER_DRAFT_KEY) ?? "{}") as {
      name?: string;
      phone?: string;
    };
  } catch {
    return {};
  }
}

function getStep(value: string | null): JoinStep {
  if (value === "details" || value === "team" || value === "team-name" || value === "waiting") {
    return value;
  }
  return "code";
}

function getAvatarLabel(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase() || "?";
}

async function uploadAvatar(file: File, playerId: string, kind: "player" | "team") {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.7,
    maxWidthOrHeight: 700,
    useWebWorker: true,
  });
  const extension = compressed.type.includes("png") ? "png" : "jpg";
  const filePath = `${playerId}/${kind}-avatar-${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from("photos").upload(filePath, compressed, {
    cacheControl: "3600",
    upsert: true,
    contentType: compressed.type || "image/jpeg",
  });
  if (error) throw error;
  return supabase.storage.from("photos").getPublicUrl(filePath).data.publicUrl;
}

export default function Join() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const players = usePlayers() as JoinPlayer[];
  const step = getStep(searchParams.get("step"));
  const queryCode = searchParams.get("code") ?? "";

  const [code, setCode] = useState(() => queryCode.replace(/\D/g, "").slice(0, 6));
  const [eventInfo, setEventInfo] = useState<GameJoinInfo | null>(null);
  const [validatedCode, setValidatedCode] = useState<string | null>(null);
  const [name, setName] = useState(() => readDraft().name ?? "");
  const [phone, setPhone] = useState(() => readDraft().phone ?? "");
  const [playerImage, setPlayerImage] = useState<File | null>(null);
  const [playerImagePreview, setPlayerImagePreview] = useState<string | null>(null);
  const [teamImage, setTeamImage] = useState<File | null>(null);
  const [teamImagePreview, setTeamImagePreview] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teams, setTeams] = useState<JoinTeam[]>([]);
  const [activePlayer, setActivePlayer] = useState<JoinPlayer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const setStep = useCallback((nextStep: JoinStep, nextCode = code) => {
    const next = new URLSearchParams();
    next.set("step", nextStep);
    if (nextCode) next.set("code", nextCode);
    setSearchParams(next);
  }, [code, setSearchParams]);

  useEffect(() => {
    if (queryCode) setCode(queryCode.replace(/\D/g, "").slice(0, 6));
  }, [queryCode]);

  useEffect(() => {
    try {
      sessionStorage.setItem(PLAYER_DRAFT_KEY, JSON.stringify({ name, phone }));
    } catch {
      // The form remains usable if browser storage is disabled.
    }
  }, [name, phone]);

  const loadGameInfo = useCallback(async (candidateCode: string, requireOpen: boolean) => {
    const normalizedCode = candidateCode.replace(/\D/g, "").slice(0, 6);
    if (normalizedCode.length !== 6) {
      setErrorMessage("Enter the 6-digit game code from your host.");
      return null;
    }

    setErrorMessage(null);
    const { data, error } = await supabase
      .from("game_state")
      .select("id, join_code, event_name, event_image_url, join_open, game_status")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      console.error("JOIN GAME LOOKUP ERROR", error);
      setErrorMessage("The game setup needs updating before players can join. Ask the host to check the join-flow database setup.");
      return null;
    }
    if (!data) {
      setErrorMessage("No game has been set up yet. Ask your host to open the game.");
      return null;
    }

    const gameInfo = data as GameJoinInfo;
    if (String(gameInfo.join_code ?? "") !== normalizedCode) {
      setErrorMessage("That code doesn't match. Check the code with your host and try again.");
      return null;
    }
    if (requireOpen && (!gameInfo.join_open || gameInfo.game_status !== "lobby")) {
      setErrorMessage("This game isn't accepting new players right now. Check with your host.");
      return null;
    }

    setEventInfo(gameInfo);
    setValidatedCode(normalizedCode);
    return gameInfo;
  }, []);

  // Allow a copied host QR link to pre-fill ?code=123456. If the browser is
  // refreshed mid-flow, restore the event details and saved player session.
  useEffect(() => {
    if (step === "code") return;
    const codeFromUrl = (searchParams.get("code") ?? "").replace(/\D/g, "").slice(0, 6);
    if (!codeFromUrl) {
      setStep("code", "");
      return;
    }

    if (validatedCode !== codeFromUrl) {
      void loadGameInfo(codeFromUrl, false).then((loaded) => {
        if (!loaded) setStep("code", codeFromUrl);
      });
    }
  }, [step, searchParams, validatedCode, loadGameInfo, setStep]);

  useEffect(() => {
    if (step !== "team" && step !== "team-name" && step !== "waiting") return;
    if (activePlayer) return;
    const storedId = getPlayerId();
    if (!storedId) {
      setStep("details");
      return;
    }

    let cancelled = false;
    void supabase.from("players").select("*").eq("id", storedId).maybeSingle().then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data) {
        setStep("details");
        return;
      }
      setActivePlayer(data as JoinPlayer);
    });
    return () => { cancelled = true; };
  }, [step, activePlayer, setStep]);

  const loadTeams = useCallback(async () => {
    setLoadingTeams(true);
    const { data, error } = await supabase
      .from("teams")
      .select("id, name, avatar_url")
      .order("name", { ascending: true });
    setLoadingTeams(false);
    if (error) {
      console.error("LOAD JOIN TEAMS ERROR", error);
      setErrorMessage("Couldn't load teams. Ask the host to check the player-join setup.");
      return;
    }
    setTeams((data ?? []) as JoinTeam[]);
  }, []);

  useEffect(() => {
    if (step === "team" || step === "team-name") void loadTeams();
  }, [step, loadTeams]);

  useEffect(() => {
    if (step !== "team") return;
    const channel = supabase.channel("join-teams-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, () => { void loadTeams(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [step, loadTeams]);

  useEffect(() => {
    if (step !== "waiting" || !activePlayer) return;
    let cancelled = false;
    const checkGame = async () => {
      const { data, error } = await supabase.from("game_state").select("game_status").eq("id", 1).maybeSingle();
      if (cancelled || error || !data) return;
      if (data.game_status === "live") navigate("/game", { replace: true });
      if (data.game_status === "finished") setErrorMessage("This game has finished. Ask the host what to do next.");
    };
    void checkGame();
    const channel = supabase.channel("join-game-status")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "game_state", filter: "id=eq.1" }, () => { void checkGame(); })
      .subscribe();
    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [step, activePlayer, navigate]);

  const goBack = () => {
    setErrorMessage(null);
    if (step === "details") setStep("code");
    else if (step === "team") setStep("details");
    else if (step === "team-name") setStep("team");
  };

  async function handleCheckCode() {
    setSubmitting(true);
    const loaded = await loadGameInfo(code, true);
    setSubmitting(false);
    if (loaded) setStep("details", code.replace(/\D/g, "").slice(0, 6));
  }

  async function handleSaveDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMessage("Enter your name to continue.");
      return;
    }
    if (!validatedCode || validatedCode !== code.replace(/\D/g, "").slice(0, 6)) {
      setErrorMessage("Please confirm your game code again.");
      setStep("code");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    const { data, error } = await supabase.from("players").insert({
      name: cleanName,
      phone: phone.trim() || null,
      avatar_url: null,
      team: null,
      score: 0,
      is_ready: false,
    }).select("*").single();

    if (error || !data) {
      console.error("CREATE JOIN PLAYER ERROR", error);
      setSubmitting(false);
      setErrorMessage(error?.message ?? "Couldn't create your player profile. Try again.");
      return;
    }

    const createdPlayer = data as JoinPlayer;
    setActivePlayer(createdPlayer);
    setPlayerId(createdPlayer.id);

    if (playerImage) {
      try {
        const avatarUrl = await uploadAvatar(playerImage, createdPlayer.id, "player");
        const { error: avatarError } = await supabase.from("players").update({ avatar_url: avatarUrl }).eq("id", createdPlayer.id);
        if (avatarError) throw avatarError;
        setActivePlayer({ ...createdPlayer, avatar_url: avatarUrl });
      } catch (uploadError) {
        console.warn("PLAYER AVATAR UPLOAD FAILED", uploadError);
        setNoticeMessage("Your profile was saved, but the photo couldn't upload. You can still continue.");
      }
    }

    setSubmitting(false);
    setStep("team");
  }

  async function handleJoinTeam(team: JoinTeam) {
    if (!activePlayer) {
      setErrorMessage("Your player profile wasn't found. Please go back and re-enter your details.");
      return;
    }
    const members = players.filter((player) => player.team === team.name);
    const alreadyInTeam = activePlayer.team === team.name;
    if (!alreadyInTeam && members.length >= MAX_TEAM_SIZE) return;

    setSubmitting(true);
    setErrorMessage(null);
    const { error } = await supabase.from("players").update({ team: alreadyInTeam ? null : team.name, is_ready: false }).eq("id", activePlayer.id);
    setSubmitting(false);
    if (error) {
      console.error("ASSIGN TEAM ERROR", error);
      setErrorMessage("Couldn't update your team. Please try again.");
      return;
    }
    const updated = { ...activePlayer, team: alreadyInTeam ? null : team.name, is_ready: false };
    setActivePlayer(updated);
    setNoticeMessage(alreadyInTeam ? `You've left ${team.name}.` : `You've joined ${team.name}.`);
  }

  async function handleCreateTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTeamName = teamName.trim();
    if (!cleanTeamName || !activePlayer) {
      setErrorMessage("Enter a team name to continue.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    const { data: existing, error: checkError } = await supabase.from("teams").select("id, name").ilike("name", cleanTeamName).maybeSingle();
    if (checkError) {
      console.error("CHECK TEAM NAME ERROR", checkError);
      setSubmitting(false);
      setErrorMessage("Couldn't check that team name. Please try again.");
      return;
    }
    if (existing) {
      setSubmitting(false);
      setErrorMessage("That team name is already taken. Try another one.");
      return;
    }

    const { data: createdTeam, error: createError } = await supabase.from("teams").insert({ name: cleanTeamName }).select("*").single();
    if (createError || !createdTeam) {
      console.error("CREATE TEAM ERROR", createError);
      setSubmitting(false);
      setErrorMessage(createError?.message ?? "Couldn't create the team. Please try again.");
      return;
    }

    let avatarUrl: string | null = null;
    if (teamImage) {
      try {
        avatarUrl = await uploadAvatar(teamImage, activePlayer.id, "team");
        const { error: updateTeamError } = await supabase.from("teams").update({ avatar_url: avatarUrl }).eq("id", createdTeam.id);
        if (updateTeamError) throw updateTeamError;
      } catch (uploadError) {
        console.warn("TEAM AVATAR UPLOAD FAILED", uploadError);
        setNoticeMessage("The team was created, but its picture couldn't upload.");
      }
    }

    const { error: assignError } = await supabase.from("players").update({ team: cleanTeamName, is_ready: true }).eq("id", activePlayer.id);
    if (assignError) {
      console.error("ASSIGN CREATOR TO TEAM ERROR", assignError);
      setSubmitting(false);
      setErrorMessage("The team was created, but we couldn't add you to it. Go back to choose a team.");
      return;
    }

    setTeams((current) => [...current, { id: createdTeam.id, name: cleanTeamName, avatar_url: avatarUrl }]);
    setActivePlayer({ ...activePlayer, team: cleanTeamName, is_ready: true });
    setSubmitting(false);
    setStep("waiting");
  }

  async function handleReady() {
    if (!activePlayer?.team) {
      setErrorMessage("Choose a team before marking yourself ready.");
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    const { error } = await supabase.from("players").update({ is_ready: true }).eq("id", activePlayer.id);
    setSubmitting(false);
    if (error) {
      console.error("SET PLAYER READY ERROR", error);
      setErrorMessage("Couldn't save your ready status. Please try again.");
      return;
    }
    setActivePlayer({ ...activePlayer, is_ready: true });
    setStep("waiting");
  }

  const membersForTeam = useCallback((teamName: string) => {
    const fromRealtime = players.filter((player) => player.team === teamName);
    if (activePlayer && activePlayer.team === teamName && !fromRealtime.some((player) => player.id === activePlayer.id)) {
      return [...fromRealtime, activePlayer];
    }
    return fromRealtime;
  }, [players, activePlayer]);

  const eventTitle = eventInfo?.event_name?.trim() || EVENT_FALLBACK;
  const eventImage = eventInfo?.event_image_url || null;
  const playerPreview = playerImagePreview || activePlayer?.avatar_url || null;
  const teamPreview = teamImagePreview;

  function handleImageChange(event: ChangeEvent<HTMLInputElement>, kind: "player" | "team") {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Choose an image file, such as JPG or PNG.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Choose an image smaller than 10 MB.");
      return;
    }
    setErrorMessage(null);
    const previewUrl = URL.createObjectURL(file);
    if (kind === "player") {
      if (playerImagePreview) URL.revokeObjectURL(playerImagePreview);
      setPlayerImage(file);
      setPlayerImagePreview(previewUrl);
    } else {
      if (teamImagePreview) URL.revokeObjectURL(teamImagePreview);
      setTeamImage(file);
      setTeamImagePreview(previewUrl);
    }
    event.target.value = "";
  }

  function EventArtwork() {
    return (
      <div className="join-event-artwork">
        {eventImage ? <img src={eventImage} alt="" /> : <div className="join-event-artwork__placeholder"><Sparkles size={30} /><span>CHAOS</span></div>}
      </div>
    );
  }

  function TeamMemberAvatars({ team }: { team: JoinTeam }) {
    const members = membersForTeam(team.name);
    return (
      <div className="join-team-members" aria-label={`${members.length} of ${MAX_TEAM_SIZE} players`}>
        {Array.from({ length: MAX_TEAM_SIZE }, (_, index) => {
          const member = members[index];
          return (
            <div className="join-team-member" key={`${team.id}-slot-${index}`}>
              {member?.avatar_url ? <img src={member.avatar_url} alt="" /> : <span className={member ? "join-team-avatar join-team-avatar--filled" : "join-team-avatar"}>{member ? getAvatarLabel(member.name) : <Users size={19} />}</span>}
              <small>{member ? member.name.split(" ")[0] : "OPEN"}</small>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <main className="join-flow">
      <header className="join-topbar">
        <span className="join-brand">Chaos</span>
        {step !== "code" && <span className="join-topbar__title">{step === "team" ? "Join a Team" : step === "waiting" ? "You're in" : "Enter Your Details"}</span>}
        {step === "code" && <span className="join-topbar__hint">Birthday game</span>}
      </header>

      <div className={`join-flow__content join-flow__content--${step}`}>
        {step !== "code" && step !== "waiting" && (
          <button type="button" className="join-back" onClick={goBack} aria-label="Go back">
            <ArrowLeft size={18} /> Back
          </button>
        )}

        {step === "code" && (
          <section className="join-code-screen" aria-labelledby="join-code-heading">
            <div className="join-monster" aria-hidden="true"><span>👹</span><i>✦</i><b>✦</b></div>
            <h1 id="join-code-heading" className="join-display-title">JOIN<br /><span>THE CHAOS</span></h1>
            <p className="join-intro">Join a game with the 6-digit code from your host.</p>
            <form onSubmit={(event) => { event.preventDefault(); void handleCheckCode(); }}>
              <label className="join-code-label" htmlFor="join-code">Game code</label>
              <div className="join-code-boxes">
                {Array.from({ length: 6 }, (_, index) => <span className={`join-code-box ${code[index] ? "join-code-box--filled" : ""}`} key={index}>{code[index] ?? ""}</span>)}
                <input
                  id="join-code"
                  className="join-code-input-overlay"
                  value={code}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  aria-label="Enter six digit game code"
                  onChange={(event) => { setCode(event.target.value.replace(/\D/g, "").slice(0, 6)); setErrorMessage(null); }}
                />
              </div>
              <button className="join-primary-button" type="submit" disabled={submitting || code.length !== 6}>
                <Check size={18} strokeWidth={3} /> {submitting ? "Checking code…" : "Join Game"}
              </button>
            </form>
            <div className="join-scan-help"><div className="join-scan-icon"><Camera size={25} /></div><p><strong>Got a QR code?</strong><br />Scan your host's code with your phone camera. It can open this page with the game code already filled in.</p></div>
          </section>
        )}

        {step === "details" && (
          <section className="join-details-screen" aria-labelledby="join-event-heading">
            <EventArtwork />
            <div id="join-event-heading" className="join-event-title">{eventTitle}</div>
            <form className="join-form" onSubmit={(event) => { void handleSaveDetails(event); }}>
              <div className="join-form-card">
                <label htmlFor="player-name">YOUR NAME?</label>
                <div className="join-input-wrap"><span className="join-input-icon"><Users size={17} /></span><input id="player-name" autoComplete="given-name" maxLength={40} value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your name" required /></div>
              </div>
              <div className="join-form-card">
                <label htmlFor="player-phone">YOUR PHONE NUMBER? <em>(Optional)</em></label>
                <p className="join-field-help">Optional. Leave blank if you do not want to share it.</p>
                <div className="join-input-wrap"><span className="join-input-icon"><Users size={17} /></span><input id="player-phone" type="tel" autoComplete="tel" maxLength={30} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone number" /></div>
              </div>
              <div className="join-form-card join-form-card--avatar">
                <div><label>UPLOAD A PROFILE PICTURE</label><p className="join-field-help">Optional</p></div>
                <label className="join-upload-avatar" htmlFor="player-avatar" aria-label="Upload profile picture">
                  {playerPreview ? <img src={playerPreview} alt="Your profile preview" /> : <span className="join-avatar-placeholder">{name ? getAvatarLabel(name) : <Users size={38} />}</span>}
                  <span className="join-upload-plus"><Plus size={24} strokeWidth={3} /></span>
                </label>
                <input id="player-avatar" className="join-file-input" type="file" accept="image/*" onChange={(event) => handleImageChange(event, "player")} />
              </div>
              <button className="join-primary-button" type="submit" disabled={submitting || !name.trim()}><Check size={18} strokeWidth={3} /> {submitting ? "Saving your details…" : "Next"}</button>
            </form>
          </section>
        )}

        {step === "team" && (
          <section className="join-team-screen" aria-labelledby="join-team-heading">
            <h1 id="join-team-heading" className="join-display-title join-display-title--compact">CHOOSE YOUR TEAM</h1>
            {activePlayer?.team && (
              <div className="join-your-team-strip">
                <span className="join-your-team-strip__label">YOUR TEAM</span>
                <strong>{activePlayer.team}</strong>
                <span>{membersForTeam(activePlayer.team).length}/{MAX_TEAM_SIZE}</span>
              </div>
            )}
            <div className="join-team-list">
              {loadingTeams && <p className="join-muted-message">Loading teams…</p>}
              {!loadingTeams && teams.length === 0 && <div className="join-empty-teams"><Users size={28} /><strong>No teams yet</strong><span>Create the first team for your friends.</span></div>}
              {teams.map((team) => {
                const members = membersForTeam(team.name);
                const isCurrentTeam = activePlayer?.team === team.name;
                const isFull = members.length >= MAX_TEAM_SIZE;
                return (
                  <article className={`join-team-card ${isCurrentTeam ? "join-team-card--current" : ""}`} key={team.id}>
                    {team.avatar_url && <img className="join-team-card__image" src={team.avatar_url} alt="" />}
                    <div className="join-team-card__heading"><strong>{team.name}</strong><span className={isFull ? "join-capacity join-capacity--full" : "join-capacity"}>{members.length}/{MAX_TEAM_SIZE}</span></div>
                    <TeamMemberAvatars team={team} />
                    <button type="button" className={isCurrentTeam ? "join-secondary-button join-secondary-button--pink" : "join-secondary-button"} disabled={submitting || (!isCurrentTeam && isFull)} onClick={() => { void handleJoinTeam(team); }}>
                      {isCurrentTeam ? <><X size={16} /> Leave</> : isFull ? "Team full" : <><Check size={16} /> Join team</>}
                    </button>
                  </article>
                );
              })}
            </div>
            <button type="button" className="join-create-team-button" onClick={() => { setErrorMessage(null); setStep("team-name"); }}><Plus size={18} /> Create a team</button>
            <div className="join-team-sticky-action">
              <div className="join-time-chip"><Clock3 size={15} /><span>Ready when you are</span></div>
              <button type="button" className="join-primary-button" disabled={submitting || !activePlayer?.team} onClick={() => { void handleReady(); }}><Check size={18} strokeWidth={3} /> Ready</button>
            </div>
          </section>
        )}

        {step === "team-name" && (
          <section className="join-team-name-screen" aria-labelledby="join-team-name-heading">
            <h1 id="join-team-name-heading" className="join-display-title join-display-title--compact">NAME YOUR TEAM</h1>
            <div className="join-team-preview-row">
              <div className="join-team-preview-avatar">{playerPreview ? <img src={playerPreview} alt="" /> : getAvatarLabel(activePlayer?.name ?? name)}</div>
              <span>{activePlayer?.name ?? name}</span>
              <span className="join-team-preview-note">Your team starts here</span>
            </div>
            <form className="join-form" onSubmit={(event) => { void handleCreateTeam(event); }}>
              <div className="join-form-card">
                <label htmlFor="team-name">NAME YOUR TEAM</label>
                <div className="join-input-wrap"><span className="join-input-icon"><Flag size={17} /></span><input id="team-name" autoComplete="off" maxLength={32} value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="Enter your team name" required /></div>
              </div>
              <div className="join-form-card join-form-card--avatar join-form-card--team-avatar">
                <div><label>UPLOAD A TEAM PICTURE</label><p className="join-field-help">Optional</p></div>
                <label className="join-upload-avatar join-upload-avatar--team" htmlFor="team-avatar" aria-label="Upload team picture">
                  {teamPreview ? <img src={teamPreview} alt="Team picture preview" /> : <span className="join-avatar-placeholder"><Users size={38} /></span>}
                  <span className="join-upload-plus"><Plus size={24} strokeWidth={3} /></span>
                </label>
                <input id="team-avatar" className="join-file-input" type="file" accept="image/*" onChange={(event) => handleImageChange(event, "team")} />
              </div>
              <button className="join-primary-button" type="submit" disabled={submitting || !teamName.trim()}><Check size={18} strokeWidth={3} /> {submitting ? "Creating team…" : "Next"}</button>
            </form>
          </section>
        )}

        {step === "waiting" && (
          <section className="join-waiting-screen" aria-labelledby="join-waiting-heading">
            <EventArtwork />
            <div className="join-event-title">{eventTitle}</div>
            <div className="join-waiting-status"><span className="join-waiting-pulse" /><CheckCircle2 size={20} /><strong>You're in{activePlayer?.name ? `, ${activePlayer.name}` : ""}!</strong></div>
            <div className="join-waiting-copy">
              <h1 id="join-waiting-heading" className="join-display-title join-display-title--small">HANG TIGHT</h1>
              <p>Waiting for the host to confirm everyone is ready. Your game will start here automatically.</p>
            </div>
            {activePlayer?.team && <div className="join-waiting-team"><Users size={19} /><span>Your team</span><strong>{activePlayer.team}</strong></div>}
            <div className="join-waiting-spinner" aria-hidden="true"><span /><span /><span /></div>
            <button type="button" className="join-text-button" onClick={() => { setErrorMessage(null); setStep("team"); }}>Change team</button>
          </section>
        )}

        {(errorMessage || noticeMessage) && (
          <div className={`join-message ${errorMessage ? "join-message--error" : "join-message--notice"}`} role={errorMessage ? "alert" : "status"}>
            {errorMessage ? <LockKeyhole size={17} /> : <CheckCircle2 size={17} />}
            <span>{errorMessage ?? noticeMessage}</span>
            <button type="button" aria-label="Dismiss message" onClick={() => { setErrorMessage(null); setNoticeMessage(null); }}><X size={17} /></button>
          </div>
        )}
      </div>
      <footer className="join-bottom-brand"><span>CHAOS</span><i>MAKE A LITTLE TROUBLE</i></footer>
    </main>
  );
}
