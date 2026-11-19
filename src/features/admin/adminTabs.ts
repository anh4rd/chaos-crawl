export const ADMIN_TABS = [
  ["live", "🔴 Live"],
  ["tonight", "🌙 Tonight"],
  ["challenges", "🎯 Challenges"],
  ["review", "✅ Review"],
  ["screens", "📺 Screens"],
  ["voting", "🗳️ Voting"],
  ["players", "👥 Players"],
  ["teams", "🏁 Teams"],
] as const;
export type AdminTab = (typeof ADMIN_TABS)[number][0];
