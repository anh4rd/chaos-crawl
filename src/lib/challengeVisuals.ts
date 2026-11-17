const challengeIconRules: Array<[RegExp, string]> = [
  [/pineapple|fruit|food|snack|eat|taste/i, "🍍"],
  [/costume|outfit|dress|clothes|fashion|wear/i, "👗"],
  [/photo|picture|selfie|camera|evidence/i, "📸"],
  [/video|film|movie|record/i, "🎥"],
  [/dance|move|choreograph/i, "💃"],
  [/song|sing|music|noise|sound/i, "🎤"],
  [/toast|drink|cocktail|bar|cheers/i, "🍹"],
  [/team|handshake|squad|group|together/i, "🤝"],
  [/hide|sneak|secret|steal|mission|find|hunt/i, "🕵️"],
  [/draw|paint|art|create|craft|make/i, "🎨"],
  [/run|race|fast|movement|sport/i, "🏃"],
  [/talk|conversation|introduc|meet|question/i, "💬"],
  [/talent|perform|stage|entrance|show/i, "🌟"],
  [/phone|text|social/i, "📱"],
  [/best thing|item|object|collect|obtain|bring/i, "🎁"],
];

/** A consistent comic-sticker emoji for library, host preview and player cards. */
export function challengeIcon(title: string, description = ""): string {
  const copy = `${title} ${description}`;
  return (
    challengeIconRules.find(([pattern]) => pattern.test(copy))?.[1] ?? "🎯"
  );
}
