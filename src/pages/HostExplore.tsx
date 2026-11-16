import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookmarkCheck,
  Check,
  Clock3,
  Compass,
  Heart,
  MapPin,
  Search,
  Sparkles,
  Users,
  Wallet,
  X,
  Plus,
  Send,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { supabase } from "../lib/sessionSupabase";
import HostShell from "../components/host/HostShell";
import "../styles/HostPortal.css";
import "../styles/HostPlanning.css";
import "../styles/HostTheme.css";

type CatalogTab = "tasks" | "locations" | "routes";
type TaskKind = "main" | "side" | "secret";
type FavouriteType = "task" | "venue" | "route";
type SubmissionStatus = "pending" | "approved" | "rejected";

interface CommunitySubmission {
  id: string;
  item_type: "challenge" | "venue";
  title: string;
  description: string;
  payload: Record<string, unknown>;
  status: SubmissionStatus;
  submitted_by: string;
  review_note: string | null;
  created_at: string;
}

interface CatalogTask {
  id: string;
  title: string;
  description: string;
  points: number;
  minutes: number;
  prepMinutes?: number;
  performanceMinutes?: number;
  kind: TaskKind;
  tags: string[];
  setup: "none" | "basic" | "some";
}

interface LocationIdea {
  id: string;
  title: string;
  description: string;
  venueType: string;
  cost: "Free" | "Low" | "Medium" | "Higher";
  bestFor: string[];
  considerations: string[];
  oneVenue: boolean;
}

interface RouteIdea {
  id: string;
  title: string;
  description: string;
  style: string;
  duration: string;
  budget: "Low" | "Medium" | "Higher" | "Venue-dependent";
  stops: string[];
  tags: string[];
  note: string;
}

interface HostFavourite {
  id: string;
  item_type: FavouriteType;
  item_id: string;
  item_data: Record<string, unknown>;
}

const tasks: CatalogTask[] = [
  {
    id: "task-best-thing",
    title: "Obtain the best thing",
    description:
      "Find or make the best small object you can using only what's available at the venue. Present your case to the host.",
    points: 25,
    minutes: 15,
    kind: "main",
    tags: ["indoors", "improv", "no prep"],
    setup: "none",
  },
  {
    id: "task-best-noise",
    title: "Make the best noise",
    description:
      "Create a noise that will make the host laugh. No shouting at strangers or disrupting other guests.",
    points: 15,
    minutes: 5,
    kind: "main",
    tags: ["quick", "performance"],
    setup: "none",
  },
  {
    id: "task-human-statue",
    title: "Become a human statue",
    description:
      "As a team, make the most convincing statue of a famous landmark or a very confusing situation.",
    points: 20,
    minutes: 8,
    kind: "main",
    tags: ["team", "photo"],
    setup: "none",
  },
  {
    id: "task-party-ad",
    title: "Advertise this party",
    description:
      "Make a 15-second advert for the party using three random words chosen by the host.",
    points: 20,
    minutes: 10,
    kind: "main",
    tags: ["video", "team"],
    setup: "none",
  },
  {
    id: "task-portrait",
    title: "Draw the host",
    description:
      "Draw the host with your non-dominant hand. The host judges the results.",
    points: 15,
    minutes: 8,
    kind: "main",
    tags: ["creative", "equipment helpful"],
    setup: "basic",
  },
  {
    id: "task-paper-tower",
    title: "The tallest tiny tower",
    description:
      "Build the tallest freestanding tower from supplied items. Keep it safe and easy to clear away.",
    points: 20,
    minutes: 10,
    kind: "main",
    tags: ["equipment", "team"],
    setup: "basic",
  },
  {
    id: "task-secret-toast",
    title: "The suspicious toast",
    description:
      "Get a teammate to make a dramatic toast without telling them why.",
    points: 10,
    minutes: 10,
    kind: "side",
    tags: ["secret", "social"],
    setup: "none",
  },
  {
    id: "task-secret-word",
    title: "Sneak in the word",
    description:
      "Use the word “pineapple” naturally in three conversations with your own team.",
    points: 10,
    minutes: 15,
    kind: "side",
    tags: ["secret", "no prep"],
    setup: "none",
  },
  {
    id: "task-team-laugh",
    title: "Make your team laugh",
    description:
      "Make every teammate laugh without touching them or using your phone.",
    points: 10,
    minutes: 5,
    kind: "side",
    tags: ["quick", "team"],
    setup: "none",
  },
  {
    id: "task-handshake",
    title: "Invent a secret handshake",
    description:
      "Create and perform a team handshake that lasts exactly five seconds.",
    points: 10,
    minutes: 10,
    kind: "side",
    tags: ["team", "performance"],
    setup: "none",
  },
  {
    id: "task-secret-mission",
    title: "Secret mission",
    description:
      "Complete a discreet, harmless mission without telling the other teams what it is.",
    points: 15,
    minutes: 20,
    kind: "secret",
    tags: ["secret", "sneaky"],
    setup: "none",
  },
  {
    id: "task-sabotage",
    title: "Friendly sabotage",
    description:
      "Give another team a ridiculous distraction using only words. No hiding, damaging or taking belongings.",
    points: 10,
    minutes: 10,
    kind: "secret",
    tags: ["silly", "social"],
    setup: "none",
  },
  {
    id: "task-pineapple-fashion",
    title: "Pineapple couture",
    description:
      "Create the most convincing outfit accessory from safe, available materials. Model it like a serious fashion show.",
    points: 20,
    minutes: 12,
    kind: "main",
    tags: ["creative", "team", "performance"],
    setup: "basic",
  },
  {
    id: "task-useless-invention",
    title: "Invent something useless",
    description:
      "Pitch a completely unnecessary invention and demonstrate how it solves a problem nobody has.",
    points: 20,
    minutes: 10,
    kind: "main",
    tags: ["improv", "performance"],
    setup: "none",
  },
  {
    id: "task-secret-selfie",
    title: "Album cover energy",
    description:
      "Stage a dramatic album cover using only your team and the room around you. Ask before photographing anyone else.",
    points: 15,
    minutes: 8,
    kind: "side",
    tags: ["photo", "creative"],
    setup: "none",
  },
  {
    id: "task-silent-director",
    title: "Silent director",
    description:
      "Direct your team into a scene without speaking. The host guesses the scene.",
    points: 15,
    minutes: 6,
    kind: "main",
    tags: ["team", "quick", "performance"],
    setup: "none",
  },
];

const locations: LocationIdea[] = [
  {
    id: "loc-private-room",
    title: "Private function room",
    description:
      "A room you can decorate, make noise in and use for a host-led finale without competing with the whole venue.",
    venueType: "private-room",
    cost: "Medium",
    bestFor: ["birthday", "team games", "finale"],
    considerations: [
      "Check screen / speaker access",
      "Ask about setup and clear-up time",
      "Confirm whether outside food is allowed",
    ],
    oneVenue: true,
  },
  {
    id: "loc-pub-room",
    title: "Pub or bar with a bookable room",
    description:
      "A familiar social setting with a clear base for challenge rounds, judging and a final scoreboard.",
    venueType: "pub",
    cost: "Medium",
    bestFor: ["adults", "social", "watching sport"],
    considerations: [
      "Confirm the room is exclusive or semi-private",
      "Check TV / sound arrangements",
      "Make sure tasks won't disrupt other guests",
    ],
    oneVenue: true,
  },
  {
    id: "loc-home",
    title: "Living room party",
    description:
      "Low-cost, flexible and easy to customise. Great for silly performance tasks and an informal host station.",
    venueType: "home",
    cost: "Free",
    bestFor: ["budget", "small groups", "creative"],
    considerations: [
      "Make a clear play area",
      "Agree quiet / neighbour-friendly times",
      "Keep exits and walkways clear",
    ],
    oneVenue: true,
  },
  {
    id: "loc-garden",
    title: "Garden or beer garden",
    description:
      "Room for physical team challenges, photo tasks and outdoor games with an indoor fallback.",
    venueType: "garden",
    cost: "Low",
    bestFor: ["outdoors", "summer", "team games"],
    considerations: [
      "Have a wet-weather backup",
      "Check lighting after dark",
      "Avoid games that damage plants or property",
    ],
    oneVenue: true,
  },
  {
    id: "loc-community-hall",
    title: "Community hall",
    description:
      "A practical blank canvas for larger groups, team stations, props and a projector or screen.",
    venueType: "hall",
    cost: "Low",
    bestFor: ["large groups", "budget", "accessible setup"],
    considerations: [
      "Check access / step-free routes",
      "Ask about tables, chairs and AV equipment",
      "Allow time for setup and reset",
    ],
    oneVenue: true,
  },
  {
    id: "loc-karaoke",
    title: "Private karaoke room",
    description:
      "A ready-made stage for performance rounds, lip-sync battles, jingles and dramatic presentations.",
    venueType: "other",
    cost: "Higher",
    bestFor: ["performance", "music", "small groups"],
    considerations: [
      "Check whether you can bring in props",
      "Confirm room capacity and booking length",
      "Plan rounds around the venue's equipment",
    ],
    oneVenue: true,
  },
  {
    id: "loc-arcade",
    title: "Arcade, bowling or activity venue",
    description:
      "Built-in activities and plenty to react to, ideal for a short game with a natural competitive feel.",
    venueType: "other",
    cost: "Higher",
    bestFor: ["competition", "mixed ages", "activities"],
    considerations: [
      "Check the group rate and booking slots",
      "Keep tasks within your booking area",
      "Plan for noise and crowded areas",
    ],
    oneVenue: true,
  },
  {
    id: "loc-boardgame-cafe",
    title: "Board-game café",
    description:
      "A sociable base for puzzle, bluffing and observation challenges without needing a large room.",
    venueType: "other",
    cost: "Medium",
    bestFor: ["puzzles", "small groups", "low-prep"],
    considerations: [
      "Check group bookings and table fees",
      "Keep tasks respectful of other customers",
      "Ask before moving venue-owned games",
    ],
    oneVenue: true,
  },
  {
    id: "loc-park",
    title: "Park or picnic area",
    description:
      "A casual outdoor base for low-equipment games, team photos and challenges using the surroundings.",
    venueType: "garden",
    cost: "Free",
    bestFor: ["outdoors", "budget", "daytime"],
    considerations: [
      "Check local rules and any booking needs",
      "Have a bad-weather alternative",
      "Leave the area as you found it",
    ],
    oneVenue: false,
  },
  {
    id: "loc-beach",
    title: "Beach or waterfront spot",
    description:
      "A scenic place for creative photo prompts, team poses and low-impact outdoor rounds.",
    venueType: "other",
    cost: "Free",
    bestFor: ["outdoors", "summer", "photo"],
    considerations: [
      "Check tide / weather conditions and access",
      "Keep away from hazards and private property",
      "Plan a nearby sheltered backup",
    ],
    oneVenue: false,
  },
  {
    id: "loc-student-union",
    title: "Student union or social club",
    description:
      "Often designed for groups and events, with a useful mix of seating and social space.",
    venueType: "pub",
    cost: "Low",
    bestFor: ["students", "budget", "large groups"],
    considerations: [
      "Check access and guest policies",
      "Ask about room booking and AV",
      "Confirm event times",
    ],
    oneVenue: true,
  },
  {
    id: "loc-hired-studio",
    title: "Hired creative studio",
    description:
      "A distinctive blank space for craft, costume, video and design-led rounds.",
    venueType: "other",
    cost: "Higher",
    bestFor: ["creative", "costume", "photo/video"],
    considerations: [
      "Confirm permitted materials and cleanup",
      "Check whether the space has enough seating",
      "Budget for any equipment hire",
    ],
    oneVenue: true,
  },
];

const routes: RouteIdea[] = [
  {
    id: "route-classic-three",
    title: "The classic three-stop",
    description:
      "A simple, easy-to-customise route template for a first-time host.",
    style: "Classic crawl",
    duration: "3–4 hours",
    budget: "Medium",
    stops: [
      "Meet-up pub or café",
      "Challenge-friendly second stop",
      "Final venue with space to gather",
    ],
    tags: ["first-timers", "social", "3 stops"],
    note: "Template only — replace each stop with places in your area and check real walking times before inviting guests.",
  },
  {
    id: "route-games-drinks",
    title: "Games, drinks & a finale",
    description:
      "Mix a competitive activity with relaxed stops and a final space to present results.",
    style: "Activity-led",
    duration: "4–5 hours",
    budget: "Higher",
    stops: [
      "Activity venue (arcade, bowling or games bar)",
      "Casual food / drink stop",
      "Final room or dance venue",
    ],
    tags: ["activities", "finale", "groups"],
    note: "Check group availability and book the activity and finale before locking the route.",
  },
  {
    id: "route-budget-chaos",
    title: "Budget-friendly chaos",
    description:
      "Keep spending low with a free outdoor challenge and casual, inexpensive stops.",
    style: "Budget",
    duration: "2–3 hours",
    budget: "Low",
    stops: [
      "Public outdoor meet-up spot",
      "Low-cost café or pub",
      "Final gathering spot",
    ],
    tags: ["budget", "outdoors", "low prep"],
    note: "Check permissions for the outdoor stop and make sure the route works in poor weather.",
  },
  {
    id: "route-outdoor-indoor",
    title: "Outdoor to indoor",
    description:
      "Start outdoors for daylight challenges, then move to a sheltered venue as the evening progresses.",
    style: "Mixed setting",
    duration: "3–4 hours",
    budget: "Medium",
    stops: [
      "Park or public green space",
      "Pub / café with outdoor seating",
      "Indoor room for the final",
    ],
    tags: ["seasonal", "outdoors", "backup plan"],
    note: "Choose an indoor fallback and check accessibility between each real stop.",
  },
  {
    id: "route-photo-trail",
    title: "Photo challenge trail",
    description:
      "Build a route around visual prompts and team evidence rather than spending time at every stop.",
    style: "Photo-led",
    duration: "2–3 hours",
    budget: "Low",
    stops: [
      "Public meeting point",
      "Distinctive public landmark / artwork",
      "Food or drink finish",
    ],
    tags: ["photo", "creative", "teams"],
    note: "Do not photograph strangers without permission, enter private property or obstruct public spaces.",
  },
  {
    id: "route-single-venue",
    title: "One-venue challenge circuit",
    description:
      "A no-travel alternative: use different areas inside one booked venue to make rounds feel varied.",
    style: "Stationary party",
    duration: "2–4 hours",
    budget: "Venue-dependent",
    stops: [
      "Main game table / host station",
      "Photo or performance corner",
      "Finale / scoreboard area",
    ],
    tags: ["one venue", "birthday", "accessible"],
    note: "Best for your current single-venue birthday build. Agree which areas you can use with the venue.",
  },
  {
    id: "route-food-first",
    title: "Food-first social route",
    description:
      "A relaxed plan that keeps meals central and places short challenges between them.",
    style: "Food-led",
    duration: "3–4 hours",
    budget: "Medium",
    stops: ["Casual food venue", "Social pub / café", "Booked final hangout"],
    tags: ["food", "social", "mixed ages"],
    note: "Confirm table sizes, dietary needs and booking durations before choosing the stops.",
  },
  {
    id: "route-quirky-venues",
    title: "Quirky venues and finale",
    description:
      "Choose distinctive venues for atmosphere, but keep the route short enough that the game remains easy to host.",
    style: "Novelty",
    duration: "3–5 hours",
    budget: "Higher",
    stops: [
      "Unusual café / themed bar",
      "Interactive or playful venue",
      "Dancefloor or private finale space",
    ],
    tags: ["quirky", "party", "finale"],
    note: "Use actual venue websites to verify access, opening hours and bookable spaces; these are route roles, not a verified route.",
  },
];

function itemData(item: CatalogTask | LocationIdea | RouteIdea) {
  return JSON.parse(JSON.stringify(item)) as Record<string, unknown>;
}

const CHALLENGE_TAG_OPTIONS = [
  "team",
  "solo",
  "creative",
  "performance",
  "photo",
  "video",
  "quick",
  "social",
  "improv",
  "silly",
  "strategy",
  "communication",
  "observation",
  "music",
  "drawing",
  "puzzle",
  "secret",
  "indoors",
  "outdoors",
  "no prep",
  "equipment",
  "low prep",
] as const;

export default function HostExplore() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<CatalogTab>("tasks");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [favourites, setFavourites] = useState<HostFavourite[]>([]);
  const [loadingFavourites, setLoadingFavourites] = useState(true);
  const [busyFavourite, setBusyFavourite] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [expandedRoutes, setExpandedRoutes] = useState<string[]>([]);
  const [submissions, setSubmissions] = useState<CommunitySubmission[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [editingSubmission, setEditingSubmission] =
    useState<CommunitySubmission | null>(null);
  const [submittingChallenge, setSubmittingChallenge] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [challengeDraft, setChallengeDraft] = useState({
    title: "",
    description: "",
    kind: "main" as TaskKind,
    points: 20,
    minutes: 10,
    prepMinutes: 0,
    performanceMinutes: 0,
    tags: ["creative", "team"] as string[],
    setup: "none" as CatalogTask["setup"],
  });

  const loadFavourites = useCallback(async () => {
    setLoadingFavourites(true);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setError("Your session has expired. Please log in again.");
      setLoadingFavourites(false);
      return;
    }
    const { data, error: queryError } = await supabase
      .from("host_favourites")
      .select("id,item_type,item_id,item_data")
      .eq("host_id", userData.user.id);
    setLoadingFavourites(false);
    if (queryError) {
      setError(
        "Couldn't load your saved items. Check that the host planning migration has been run.",
      );
      return;
    }
    setFavourites((data ?? []) as HostFavourite[]);
  }, []);

  useEffect(() => {
    void loadFavourites();
  }, [loadFavourites]);

  const loadSubmissions = useCallback(async () => {
    const [{ data: userData }, { data: adminData, error: adminError }] =
      await Promise.all([
        supabase.auth.getUser(),
        supabase.rpc("cc_is_platform_admin"),
      ]);
    if (adminError) {
      console.warn(
        "Platform-admin check unavailable; community review controls remain hidden.",
        adminError,
      );
    }
    setIsPlatformAdmin(Boolean(adminData));
    if (!userData.user) return;
    setCurrentUserId(userData.user.id);
    const { data, error: queryError } = await supabase
      .from("cc_catalog_submissions")
      .select(
        "id,item_type,title,description,payload,status,submitted_by,review_note,created_at",
      )
      .order("created_at", { ascending: false });
    if (queryError) {
      setError(
        "Community submissions need the catalogue moderation migration. Run 20261112_community_catalog_and_host_view_as.sql in Supabase.",
      );
      return;
    }
    setSubmissions((data ?? []) as CommunitySubmission[]);
  }, []);

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions]);

  const communityTasks = useMemo<CatalogTask[]>(
    () =>
      submissions
        .filter(
          (submission) =>
            submission.item_type === "challenge" &&
            submission.status === "approved",
        )
        .map((submission) => ({
          id: `community-${submission.id}`,
          title: submission.title,
          description: submission.description,
          points: Number(submission.payload.points ?? 20),
          minutes: Number(submission.payload.minutes ?? 10),
          prepMinutes: Number(submission.payload.prepMinutes ?? 0) || undefined,
          performanceMinutes:
            Number(submission.payload.performanceMinutes ?? 0) || undefined,
          kind: (submission.payload.kind === "side" ||
          submission.payload.kind === "secret"
            ? submission.payload.kind
            : "main") as TaskKind,
          tags: Array.isArray(submission.payload.tags)
            ? submission.payload.tags.map(String)
            : ["community"],
          setup:
            submission.payload.setup === "basic" ||
            submission.payload.setup === "some"
              ? submission.payload.setup
              : "none",
        })),
    [submissions],
  );

  const categories = useMemo(() => {
    if (tab === "tasks")
      return [
        "all",
        "main",
        "side",
        "secret",
        "quick",
        "team",
        "creative",
        "no prep",
      ];
    if (tab === "locations")
      return [
        "all",
        "one venue",
        "outdoors",
        "budget",
        "performance",
        "large groups",
      ];
    return [
      "all",
      "one venue",
      "budget",
      "outdoors",
      "photo",
      "finale",
      "quirky",
    ];
  }, [tab]);

  const visibleTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...tasks, ...communityTasks].filter((item) => {
      const searchable = [item.title, item.description, item.kind, ...item.tags]
        .join(" ")
        .toLowerCase();
      const searchMatch = !q || searchable.includes(q);
      const categoryMatch =
        category === "all" ||
        category === item.kind ||
        item.tags.some((tag) => tag.toLowerCase().includes(category));
      return searchMatch && categoryMatch;
    });
  }, [search, category, communityTasks]);

  const visibleLocations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return locations.filter((item) => {
      const searchable = [
        item.title,
        item.description,
        item.venueType,
        item.cost,
        ...item.bestFor,
        ...item.considerations,
      ]
        .join(" ")
        .toLowerCase();
      const searchMatch = !q || searchable.includes(q);
      const categoryMatch =
        category === "all" ||
        (category === "one venue" && item.oneVenue) ||
        (category === "outdoors" && item.bestFor.includes("outdoors")) ||
        (category === "budget" && ["Free", "Low"].includes(item.cost)) ||
        item.bestFor.some((tag) => tag.toLowerCase().includes(category));
      return searchMatch && categoryMatch;
    });
  }, [search, category]);

  const visibleRoutes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return routes.filter((item) => {
      const searchable = [
        item.title,
        item.description,
        item.style,
        item.duration,
        item.budget,
        ...item.stops,
        ...item.tags,
      ]
        .join(" ")
        .toLowerCase();
      const searchMatch = !q || searchable.includes(q);
      const categoryMatch =
        category === "all" ||
        (category === "one venue" && item.tags.includes("one venue")) ||
        (category === "budget" && item.budget === "Low") ||
        item.tags.some((tag) => tag.toLowerCase().includes(category));
      return searchMatch && categoryMatch;
    });
  }, [search, category]);

  function isSaved(type: FavouriteType, id: string) {
    return favourites.some(
      (item) => item.item_type === type && item.item_id === id,
    );
  }

  async function toggleFavourite(
    type: FavouriteType,
    id: string,
    data: CatalogTask | LocationIdea | RouteIdea,
  ) {
    const key = `${type}:${id}`;
    setBusyFavourite(key);
    setError("");
    const existing = favourites.find(
      (item) => item.item_type === type && item.item_id === id,
    );
    if (existing) {
      const { error: deleteError } = await supabase
        .from("host_favourites")
        .delete()
        .eq("id", existing.id);
      setBusyFavourite(null);
      if (deleteError) {
        setError(deleteError.message);
        return;
      }
      setFavourites((current) =>
        current.filter((item) => item.id !== existing.id),
      );
      return;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setBusyFavourite(null);
      setError("Your host session has expired. Please log in again.");
      return;
    }

    const { data: saved, error: saveError } = await supabase
      .from("host_favourites")
      .insert({
        host_id: userData.user.id,
        item_type: type,
        item_id: id,
        item_data: itemData(data),
      })
      .select("id,item_type,item_id,item_data")
      .single();
    setBusyFavourite(null);
    if (saveError) {
      setError(
        type === "route"
          ? "Route favourites need the latest host catalogue migration. Run 20261023_host_catalog_routes.sql in Supabase, then try again."
          : saveError.message,
      );
      return;
    }
    if (saved) setFavourites((current) => [...current, saved as HostFavourite]);
  }

  function addTaskToPlan(task: CatalogTask, kind: "main" | "side") {
    if (task.id.startsWith("community-")) {
      navigate(
        `/host/games/new?communityTask=${encodeURIComponent(task.id.slice("community-".length))}&challengeKind=${kind}`,
      );
      return;
    }
    navigate(
      `/host/games/new?exploreTask=${encodeURIComponent(JSON.stringify(task))}&challengeKind=${kind}`,
    );
  }

  function selectLocationIdea(location: LocationIdea) {
    navigate(`/host/games/new?venueIdea=${encodeURIComponent(location.id)}`);
  }

  function toggleRoute(id: string) {
    setExpandedRoutes((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  async function submitChallenge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingChallenge(true);
    setError("");
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setError("Your session has expired. Please log in again.");
      setSubmittingChallenge(false);
      return;
    }
    const payload = {
      kind: challengeDraft.kind,
      points: Math.max(0, Math.min(100, Number(challengeDraft.points) || 0)),
      minutes: Math.max(1, Math.min(180, Number(challengeDraft.minutes) || 1)),
      prepMinutes: Math.max(
        0,
        Math.min(180, Number(challengeDraft.prepMinutes) || 0),
      ),
      performanceMinutes: Math.max(
        0,
        Math.min(180, Number(challengeDraft.performanceMinutes) || 0),
      ),
      tags: challengeDraft.tags.slice(0, 8),
      setup: challengeDraft.setup,
    };
    const query = editingSubmission
      ? supabase
          .from("cc_catalog_submissions")
          .update({
            title: challengeDraft.title.trim(),
            description: challengeDraft.description.trim(),
            payload,
          })
          .eq("id", editingSubmission.id)
          .eq("status", "approved")
      : supabase.from("cc_catalog_submissions").insert({
          item_type: "challenge",
          title: challengeDraft.title.trim(),
          description: challengeDraft.description.trim(),
          payload,
          status: "pending",
          submitted_by: userData.user.id,
        });
    const { error: insertError } = await query;
    setSubmittingChallenge(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setChallengeDraft({
      title: "",
      description: "",
      kind: "main",
      points: 20,
      minutes: 10,
      prepMinutes: 0,
      performanceMinutes: 0,
      tags: ["creative", "team"],
      setup: "none",
    });
    setEditingSubmission(null);
    setShowCreateChallenge(false);
    await loadSubmissions();
  }

  function editCommunityChallenge(submission: CommunitySubmission) {
    setEditingSubmission(submission);
    setChallengeDraft({
      title: submission.title,
      description: submission.description,
      kind: (submission.payload.kind === "side" ||
      submission.payload.kind === "secret"
        ? submission.payload.kind
        : "main") as TaskKind,
      points: Number(submission.payload.points ?? 20),
      minutes: Number(submission.payload.minutes ?? 10),
      prepMinutes: Number(submission.payload.prepMinutes ?? 0),
      performanceMinutes: Number(submission.payload.performanceMinutes ?? 0),
      tags: Array.isArray(submission.payload.tags)
        ? submission.payload.tags.map(String).slice(0, 8)
        : ["creative", "team"],
      setup:
        submission.payload.setup === "basic" ||
        submission.payload.setup === "some"
          ? submission.payload.setup
          : "none",
    });
    setShowCreateChallenge(true);
  }

  async function deleteCommunityChallenge(submission: CommunitySubmission) {
    if (
      !isPlatformAdmin ||
      !window.confirm(
        `Delete “${submission.title}” from the shared challenge library?`,
      )
    )
      return;
    setReviewingId(submission.id);
    setError("");
    const { error: deleteError } = await supabase
      .from("cc_catalog_submissions")
      .delete()
      .eq("id", submission.id)
      .eq("status", "approved");
    setReviewingId(null);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await loadSubmissions();
  }

  async function reviewSubmission(
    submission: CommunitySubmission,
    status: "approved" | "rejected",
  ) {
    setReviewingId(submission.id);
    setError("");
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user || !isPlatformAdmin) {
      setError("Only a platform administrator can review submissions.");
      setReviewingId(null);
      return;
    }
    const { error: updateError } = await supabase
      .from("cc_catalog_submissions")
      .update({
        status,
        reviewed_by: userData.user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", submission.id)
      .eq("status", "pending");
    setReviewingId(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await loadSubmissions();
  }

  const pendingSubmissions = submissions.filter(
    (submission) => submission.status === "pending",
  );
  const mySubmissions = submissions.filter(
    (submission) =>
      submission.submitted_by === currentUserId &&
      submission.status !== "approved",
  );
  const itemCount =
    tab === "tasks"
      ? visibleTasks.length
      : tab === "locations"
        ? visibleLocations.length
        : visibleRoutes.length;

  return (
    <HostShell
      title="Explore the library"
      subtitle="Browse ideas, save inspiration and contribute challenges to the shared catalogue."
      showCreate
    >
      <section className="host-explore-hero">
        <div className="host-explore-hero-copy">
          <span className="host-eyebrow host-eyebrow--light">
            YOUR NEXT GOOD BAD IDEA
          </span>
          <h2>Steal a little inspiration.</h2>
          <p>
            Browse ready-to-use tasks, places to host and route templates.
            Create your own challenges and submit them to the community library.
          </p>
        </div>
        <div className="host-explore-hero-art" aria-hidden="true">
          <Sparkles size={52} />
          <span>
            IDEAS
            <br />
            INSIDE
          </span>
        </div>
      </section>

      {error && (
        <div className="host-alert host-alert--error" role="alert">
          {error}
        </div>
      )}

      {isPlatformAdmin && pendingSubmissions.length > 0 && (
        <section className="host-community-review">
          <div className="host-community-section-heading">
            <div>
              <span className="host-community-kicker">
                <ShieldCheck size={14} /> PLATFORM MODERATION
              </span>
              <h2>
                Community review queue <span>{pendingSubmissions.length}</span>
              </h2>
              <p>
                Approve safe, clear contributions to publish them to every
                host's Explore library.
              </p>
            </div>
          </div>
          <div className="host-community-review-list">
            {pendingSubmissions.map((submission) => (
              <article
                className="host-community-review-card"
                key={submission.id}
              >
                <div>
                  <span className="host-community-type">
                    {submission.item_type}
                  </span>
                  <h3>{submission.title}</h3>
                  <p>{submission.description}</p>
                  {submission.item_type === "challenge" && (
                    <small>
                      {String(submission.payload.kind ?? "main")} ·{" "}
                      {String(submission.payload.minutes ?? 10)} min ·{" "}
                      {String(submission.payload.points ?? 20)} points
                    </small>
                  )}
                  <small>
                    Submitted{" "}
                    {new Date(submission.created_at).toLocaleDateString()}
                  </small>
                </div>
                <div className="host-community-review-actions">
                  <button
                    type="button"
                    className="host-button host-button--lime"
                    disabled={reviewingId === submission.id}
                    onClick={() =>
                      void reviewSubmission(submission, "approved")
                    }
                  >
                    <CheckCircle2 size={15} /> Approve
                  </button>
                  <button
                    type="button"
                    className="host-button host-button--secondary"
                    disabled={reviewingId === submission.id}
                    onClick={() =>
                      void reviewSubmission(submission, "rejected")
                    }
                  >
                    <XCircle size={15} /> Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="host-explore-toolbar">
        <div
          className="host-explore-tabs"
          role="tablist"
          aria-label="Explore catalogue"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "tasks"}
            className={tab === "tasks" ? "is-active" : ""}
            onClick={() => {
              setTab("tasks");
              setCategory("all");
            }}
          >
            <Sparkles size={16} /> Tasks{" "}
            <span>{tasks.length + communityTasks.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "locations"}
            className={tab === "locations" ? "is-active" : ""}
            onClick={() => {
              setTab("locations");
              setCategory("all");
            }}
          >
            <MapPin size={16} /> Locations <span>{locations.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "routes"}
            className={tab === "routes" ? "is-active" : ""}
            onClick={() => {
              setTab("routes");
              setCategory("all");
            }}
          >
            <Compass size={16} /> Routes <span>{routes.length}</span>
          </button>
        </div>
        <label className="host-explore-search">
          <Search size={17} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Search ${tab}…`}
            aria-label={`Search ${tab}`}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </label>
      </div>

      <div className="host-explore-categories" aria-label="Filter catalogue">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            className={category === item ? "is-active" : ""}
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
          >
            {item === "all" ? "Everything" : item}
          </button>
        ))}
      </div>

      <div className="host-explore-results">
        <div className="host-explore-results-heading">
          <div>
            <h2>
              {tab === "tasks"
                ? "Ready-made challenges"
                : tab === "locations"
                  ? "Places to play"
                  : "Route templates"}
            </h2>
            <p>
              {tab === "tasks"
                ? "Browse the shared catalogue or submit an original challenge for review."
                : tab === "locations"
                  ? "Find a setting that fits your group, budget and energy."
                  : "Adapt these structures to your own city. They are templates, not verified mapped routes."}
            </p>
          </div>
          <div className="host-explore-heading-actions">
            <span>
              {itemCount} {itemCount === 1 ? "result" : "results"}
            </span>
            {tab === "tasks" && (
              <button
                type="button"
                className="host-button host-button--primary"
                onClick={() => setShowCreateChallenge(true)}
              >
                <Plus size={16} /> Create challenge
              </button>
            )}
          </div>
        </div>

        {loadingFavourites && (
          <div className="host-explore-loading">Checking your saved items…</div>
        )}

        {tab === "tasks" && (
          <div className="host-explore-grid">
            {visibleTasks.map((task) => {
              const saved = isSaved("task", task.id);
              const communitySubmission = task.id.startsWith("community-")
                ? submissions.find(
                    (submission) =>
                      submission.id === task.id.slice("community-".length),
                  )
                : undefined;
              return (
                <article className="host-explore-card" key={task.id}>
                  <div className="host-explore-card-top">
                    <span
                      className={`host-explore-type host-explore-type--${task.kind}`}
                    >
                      {task.kind === "main"
                        ? "Main challenge"
                        : task.kind === "side"
                          ? "Side challenge"
                          : "Secret mission"}
                    </span>
                    <button
                      type="button"
                      className={`host-explore-save${saved ? " is-saved" : ""}`}
                      disabled={busyFavourite === `task:${task.id}`}
                      onClick={() =>
                        void toggleFavourite("task", task.id, task)
                      }
                      aria-label={
                        saved ? `Unsave ${task.title}` : `Save ${task.title}`
                      }
                      title={saved ? "Saved" : "Save for later"}
                    >
                      {saved ? (
                        <BookmarkCheck size={18} />
                      ) : (
                        <Heart size={18} />
                      )}
                    </button>
                  </div>
                  <h3>{task.title}</h3>
                  <p>{task.description}</p>
                  <div className="host-explore-metadata">
                    {task.prepMinutes || task.performanceMinutes ? (
                      <>
                        <span>
                          <Clock3 size={14} />
                          Prep {task.prepMinutes ?? 0} min
                        </span>
                        <span>
                          <Clock3 size={14} />
                          Performance {task.performanceMinutes ?? 0} min
                        </span>
                      </>
                    ) : (
                      <span>
                        <Clock3 size={14} />
                        {task.minutes} min
                      </span>
                    )}
                    <span>
                      <Sparkles size={14} />
                      {task.points} points
                    </span>
                    <span>
                      <Wallet size={14} />
                      {task.setup === "none"
                        ? "No kit"
                        : task.setup === "basic"
                          ? "Basic kit"
                          : "Some prep"}
                    </span>
                  </div>
                  <div className="host-explore-tags">
                    {task.tags.slice(0, 4).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  {isPlatformAdmin && communitySubmission && (
                    <div className="host-community-review-actions host-explore-admin-actions">
                      <button
                        type="button"
                        className="host-button host-button--secondary"
                        onClick={() =>
                          editCommunityChallenge(communitySubmission)
                        }
                      >
                        Edit challenge
                      </button>
                      <button
                        type="button"
                        className="host-button host-button--secondary"
                        disabled={reviewingId === communitySubmission.id}
                        onClick={() =>
                          void deleteCommunityChallenge(communitySubmission)
                        }
                      >
                        Delete
                      </button>
                    </div>
                  )}
                  <div className="host-explore-use-options">
                    <button
                      type="button"
                      className="host-button host-button--primary"
                      onClick={() => addTaskToPlan(task, "main")}
                    >
                      <PlusIcon /> Add as main
                    </button>
                    <button
                      type="button"
                      className="host-button host-button--secondary"
                      onClick={() => addTaskToPlan(task, "side")}
                    >
                      <PlusIcon /> Add as side
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {tab === "tasks" && mySubmissions.length > 0 && (
          <section className="host-my-submissions">
            <div className="host-community-section-heading">
              <div>
                <h3>Your submissions</h3>
                <p>
                  Approved challenges appear in the shared library. Pending
                  items are only visible to you and moderators.
                </p>
              </div>
            </div>
            <div className="host-my-submissions-list">
              {mySubmissions.map((submission) => (
                <div className="host-my-submission" key={submission.id}>
                  <div>
                    <strong>{submission.title}</strong>
                    <small>
                      {submission.item_type} · submitted{" "}
                      {new Date(submission.created_at).toLocaleDateString()}
                    </small>
                    {submission.review_note && (
                      <small>{submission.review_note}</small>
                    )}
                  </div>
                  <span
                    className={`host-submission-status host-submission-status--${submission.status}`}
                  >
                    {submission.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === "locations" && (
          <div className="host-explore-grid">
            {visibleLocations.map((location) => {
              const saved = isSaved("venue", location.id);
              return (
                <article className="host-explore-card" key={location.id}>
                  <div className="host-explore-card-top">
                    <span className="host-explore-type host-explore-type--location">
                      {location.oneVenue ? "Single venue" : "Outdoor idea"}
                    </span>
                    <button
                      type="button"
                      className={`host-explore-save${saved ? " is-saved" : ""}`}
                      disabled={busyFavourite === `venue:${location.id}`}
                      onClick={() =>
                        void toggleFavourite("venue", location.id, location)
                      }
                      aria-label={
                        saved
                          ? `Unsave ${location.title}`
                          : `Save ${location.title}`
                      }
                      title={saved ? "Saved" : "Save for later"}
                    >
                      {saved ? (
                        <BookmarkCheck size={18} />
                      ) : (
                        <Heart size={18} />
                      )}
                    </button>
                  </div>
                  <h3>{location.title}</h3>
                  <p>{location.description}</p>
                  <div className="host-explore-metadata">
                    <span>
                      <Wallet size={14} />
                      {location.cost} cost
                    </span>
                    <span>
                      <Users size={14} />
                      {location.bestFor[0]}
                    </span>
                  </div>
                  <div className="host-explore-tags">
                    {location.bestFor.slice(0, 4).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <details className="host-explore-details">
                    <summary>Practical checks</summary>
                    <ul>
                      {location.considerations.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </details>
                  <button
                    type="button"
                    className="host-button host-button--primary host-explore-use"
                    onClick={() => selectLocationIdea(location)}
                  >
                    Use this venue idea <ArrowRight size={15} />
                  </button>
                </article>
              );
            })}
          </div>
        )}

        {tab === "routes" && (
          <div className="host-explore-grid">
            {visibleRoutes.map((route) => {
              const saved = isSaved("route", route.id);
              const expanded = expandedRoutes.includes(route.id);
              return (
                <article
                  className="host-explore-card host-explore-route-card"
                  key={route.id}
                >
                  <div className="host-explore-card-top">
                    <span className="host-explore-type host-explore-type--route">
                      {route.style}
                    </span>
                    <button
                      type="button"
                      className={`host-explore-save${saved ? " is-saved" : ""}`}
                      disabled={busyFavourite === `route:${route.id}`}
                      onClick={() =>
                        void toggleFavourite("route", route.id, route)
                      }
                      aria-label={
                        saved ? `Unsave ${route.title}` : `Save ${route.title}`
                      }
                      title={saved ? "Saved" : "Save for later"}
                    >
                      {saved ? (
                        <BookmarkCheck size={18} />
                      ) : (
                        <Heart size={18} />
                      )}
                    </button>
                  </div>
                  <h3>{route.title}</h3>
                  <p>{route.description}</p>
                  <div className="host-explore-metadata">
                    <span>
                      <Clock3 size={14} />
                      {route.duration}
                    </span>
                    <span>
                      <Wallet size={14} />
                      {route.budget} budget
                    </span>
                    <span>
                      <MapPin size={14} />
                      {route.stops.length} stops / stages
                    </span>
                  </div>
                  <div className="host-explore-tags">
                    {route.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="host-explore-route-toggle"
                    aria-expanded={expanded}
                    onClick={() => toggleRoute(route.id)}
                  >
                    {expanded ? "Hide route outline" : "Preview route"}{" "}
                    <ArrowRight size={15} />
                  </button>
                  {expanded && (
                    <div className="host-explore-route-outline">
                      <ol>
                        {route.stops.map((stop, index) => (
                          <li key={stop}>
                            <span>{index + 1}</span>
                            <div>
                              <strong>{stop}</strong>
                              <small>
                                Choose a suitable local place for this stage.
                              </small>
                            </div>
                          </li>
                        ))}
                      </ol>
                      <p>{route.note}</p>
                    </div>
                  )}
                  <button
                    type="button"
                    className="host-button host-button--secondary host-explore-use"
                    onClick={() =>
                      void toggleFavourite("route", route.id, route)
                    }
                  >
                    {saved ? (
                      <>
                        <Check size={16} /> Saved route
                      </>
                    ) : (
                      <>
                        <Heart size={16} /> Save route
                      </>
                    )}
                  </button>
                </article>
              );
            })}
          </div>
        )}

        {!itemCount && (
          <div className="host-empty-state">
            <Search size={24} />
            <h3>No matches</h3>
            <p>Try a different search or clear your filters.</p>
            <button
              type="button"
              className="host-button host-button--secondary"
              onClick={() => {
                setSearch("");
                setCategory("all");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {showCreateChallenge && (
        <div
          className="host-community-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget)
              setShowCreateChallenge(false);
          }}
        >
          <section
            className="host-community-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="host-create-challenge-title"
          >
            <div className="host-community-modal-heading">
              <div>
                <span className="host-community-kicker">
                  {editingSubmission
                    ? "PLATFORM ADMIN"
                    : "COMMUNITY CONTRIBUTION"}
                </span>
                <h2 id="host-create-challenge-title">
                  {editingSubmission ? "Edit challenge" : "Create a challenge"}
                </h2>
                <p>
                  {editingSubmission
                    ? "Update this approved challenge in the shared Explore library."
                    : "Share an original idea. It will be checked before appearing in Explore for other hosts."}
                </p>
              </div>
              <button
                type="button"
                className="host-explore-save"
                onClick={() => {
                  setShowCreateChallenge(false);
                  setEditingSubmission(null);
                }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <form
              className="host-community-form"
              onSubmit={(event) => void submitChallenge(event)}
            >
              <label>
                <span>Challenge title</span>
                <input
                  required
                  maxLength={80}
                  value={challengeDraft.title}
                  onChange={(event) =>
                    setChallengeDraft((draft) => ({
                      ...draft,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Give it a memorable name"
                />
              </label>
              <label>
                <span>How does it work?</span>
                <textarea
                  required
                  maxLength={1200}
                  rows={4}
                  value={challengeDraft.description}
                  onChange={(event) =>
                    setChallengeDraft((draft) => ({
                      ...draft,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Explain the challenge and any rules or safety considerations."
                />
              </label>
              <div className="host-community-form-grid">
                <label>
                  <span>Challenge type</span>
                  <select
                    value={challengeDraft.kind}
                    onChange={(event) =>
                      setChallengeDraft((draft) => ({
                        ...draft,
                        kind: event.target.value as TaskKind,
                      }))
                    }
                  >
                    <option value="main">Main challenge</option>
                    <option value="side">Side challenge</option>
                    <option value="secret">Secret mission</option>
                  </select>
                </label>
                <label>
                  <span>Points</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={challengeDraft.points}
                    onChange={(event) =>
                      setChallengeDraft((draft) => ({
                        ...draft,
                        points: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Minutes</span>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={challengeDraft.minutes}
                    onChange={(event) =>
                      setChallengeDraft((draft) => ({
                        ...draft,
                        minutes: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Player prep (optional)</span>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={challengeDraft.prepMinutes ?? 0}
                    onChange={(event) =>
                      setChallengeDraft((draft) => ({
                        ...draft,
                        prepMinutes: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Player performance (optional)</span>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={challengeDraft.performanceMinutes ?? 0}
                    onChange={(event) =>
                      setChallengeDraft((draft) => ({
                        ...draft,
                        performanceMinutes: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Equipment</span>
                  <select
                    value={challengeDraft.setup}
                    onChange={(event) =>
                      setChallengeDraft((draft) => ({
                        ...draft,
                        setup: event.target.value as CatalogTask["setup"],
                      }))
                    }
                  >
                    <option value="none">No kit</option>
                    <option value="basic">Basic kit</option>
                    <option value="some">Some prep</option>
                  </select>
                </label>
              </div>
              <fieldset className="host-community-tag-fieldset">
                <legend>
                  Tags{" "}
                  <small>Choose up to 8 that describe your challenge</small>
                </legend>
                <div className="host-community-tag-options">
                  {CHALLENGE_TAG_OPTIONS.map((tag) => {
                    const selected = challengeDraft.tags.includes(tag);
                    const disabled =
                      !selected && challengeDraft.tags.length >= 8;
                    return (
                      <button
                        key={tag}
                        type="button"
                        className={`host-community-tag-option${selected ? " is-selected" : ""}`}
                        aria-pressed={selected}
                        disabled={disabled}
                        onClick={() =>
                          setChallengeDraft((draft) => ({
                            ...draft,
                            tags: selected
                              ? draft.tags.filter((item) => item !== tag)
                              : [...draft.tags, tag],
                          }))
                        }
                      >
                        {selected ? <Check size={13} /> : <PlusIcon />}
                        {tag}
                      </button>
                    );
                  })}
                </div>
                <small className="host-community-tag-count">
                  {challengeDraft.tags.length}/8 selected
                </small>
              </fieldset>
              {!editingSubmission && (
                <div className="host-community-submit-note">
                  <ShieldCheck size={16} />
                  <span>
                    Submissions are private until approved by the Chaos Crawl
                    team. Approved challenges become visible to all hosts.
                  </span>
                </div>
              )}
              <div className="host-community-modal-actions">
                <button
                  type="button"
                  className="host-button host-button--secondary"
                  onClick={() => {
                    setShowCreateChallenge(false);
                    setEditingSubmission(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="host-button host-button--primary"
                  disabled={submittingChallenge}
                >
                  {submittingChallenge ? (
                    editingSubmission ? (
                      "Saving…"
                    ) : (
                      "Submitting…"
                    )
                  ) : editingSubmission ? (
                    <>
                      <Check size={15} /> Save changes
                    </>
                  ) : (
                    <>
                      <Send size={15} /> Submit for review
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </HostShell>
  );
}

function PlusIcon() {
  return (
    <span aria-hidden="true" className="host-explore-plus">
      +
    </span>
  );
}
