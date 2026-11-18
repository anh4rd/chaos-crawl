import type { CatalogTask, LocationIdea, RouteIdea } from "./types";

export const tasks: CatalogTask[] = [
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

export const locations: LocationIdea[] = [
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

export const routes: RouteIdea[] = [
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

export const CHALLENGE_TAG_OPTIONS = [
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
