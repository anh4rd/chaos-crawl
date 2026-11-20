import openMojiData from "openmoji/data/openmoji.json";

interface OpenMojiEntry {
  emoji: string;
  hexcode: string;
  annotation: string;
  tags: string;
  openmoji_tags: string;
  order: number;
  unicode: number | string;
  skintone?: string;
}

const openMojiEntries: OpenMojiEntry[] = openMojiData.filter(
  (entry) => Number(entry.unicode) > 0 && !entry.skintone,
);

const entriesByCode = new Map(
  openMojiEntries.map((entry) => [entry.hexcode, entry]),
);

const genericEmoji = (() => {
  const entry = entriesByCode.get("1F3AF");
  if (!entry) {
    throw new Error(
      "OpenMoji's dart emoji is missing from the installed catalog.",
    );
  }
  return entry;
})();

const ignoredWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "get",
  "in",
  "into",
  "is",
  "it",
  "make",
  "of",
  "on",
  "or",
  "the",
  "their",
  "them",
  "there",
  "this",
  "to",
  "using",
  "with",
  "without",
  "your",
  "best",
  "challenge",
  "create",
  "perform",
  "task",
]);

function words(value: string) {
  return new Set(
    (
      value
        .toLowerCase()
        .normalize("NFKD")
        .match(/[\p{L}\p{N}]+/gu) ?? []
    ).filter((word) => word.length > 1 && !ignoredWords.has(word)),
  );
}

const searchableEntries = openMojiEntries.map((entry) => ({
  entry,
  annotation: words(entry.annotation),
  tags: words(entry.tags),
  openMojiTags: words(entry.openmoji_tags),
  searchText:
    `${entry.annotation} ${entry.tags} ${entry.openmoji_tags} ${entry.hexcode}`.toLowerCase(),
}));

function scoreEntry(
  entry: (typeof searchableEntries)[number],
  titleWords: Set<string>,
  descriptionWords: Set<string>,
) {
  let score = 0;
  for (const word of titleWords) {
    if (entry.annotation.has(word)) score += 6;
    if (entry.tags.has(word)) score += 4;
    if (entry.openMojiTags.has(word)) score += 2;
  }
  for (const word of descriptionWords) {
    if (entry.annotation.has(word)) score += 2;
    if (entry.tags.has(word)) score += 1.5;
    if (entry.openMojiTags.has(word)) score += 1;
  }
  return score;
}

export interface OpenMojiChoice {
  emoji: string;
  hexcode: string;
  annotation: string;
}

function choice(entry: OpenMojiEntry): OpenMojiChoice {
  return {
    emoji: entry.emoji,
    hexcode: entry.hexcode,
    annotation: entry.annotation,
  };
}

export function closestOpenMojis(
  title: string,
  description = "",
  limit = 24,
): OpenMojiChoice[] {
  const titleWords = words(title);
  const descriptionWords = words(description);
  return searchableEntries
    .map((entry) => ({
      entry,
      score: scoreEntry(entry, titleWords, descriptionWords),
    }))
    .filter((result) => result.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.entry.entry.order - right.entry.entry.order,
    )
    .slice(0, limit)
    .map((result) => choice(result.entry.entry));
}

export function closestOpenMoji(
  title: string,
  description = "",
): OpenMojiChoice {
  return closestOpenMojis(title, description, 1)[0] ?? choice(genericEmoji);
}

export function searchOpenMojis(query: string, limit = 60): OpenMojiChoice[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];
  return searchableEntries
    .filter((entry) => entry.searchText.includes(normalizedQuery))
    .sort((left, right) => {
      const leftStarts = left.entry.annotation
        .toLowerCase()
        .startsWith(normalizedQuery);
      const rightStarts = right.entry.annotation
        .toLowerCase()
        .startsWith(normalizedQuery);
      return (
        Number(rightStarts) - Number(leftStarts) ||
        left.entry.order - right.entry.order
      );
    })
    .slice(0, limit)
    .map((result) => choice(result.entry));
}

export function getOpenMoji(hexcode: string): OpenMojiChoice | undefined {
  const entry = entriesByCode.get(hexcode.toUpperCase());
  return entry ? choice(entry) : undefined;
}

export const OPENMOJI_SELECTION_PREFIX = "openmoji:";

export function selectedOpenMojiCode(selection?: string): string | undefined {
  if (!selection?.startsWith(OPENMOJI_SELECTION_PREFIX)) return undefined;
  const code = selection.slice(OPENMOJI_SELECTION_PREFIX.length).toUpperCase();
  return entriesByCode.has(code) ? code : undefined;
}

export function openMojiSelection(hexcode: string) {
  const code = hexcode.toUpperCase();
  if (!entriesByCode.has(code)) {
    throw new Error(`Unknown OpenMoji code: ${hexcode}`);
  }
  return `${OPENMOJI_SELECTION_PREFIX}${code}`;
}

function openMojiSvgUrl(hexcode: string) {
  return `${import.meta.env.BASE_URL}openmoji/${hexcode}.svg`;
}

export function challengeArtwork(
  selection: string | undefined,
  title: string,
  description = "",
) {
  if (selection && !selection.startsWith(OPENMOJI_SELECTION_PREFIX)) {
    return { src: selection, emoji: "" };
  }

  const selectedCode = selectedOpenMojiCode(selection);
  const emoji = selectedCode
    ? (entriesByCode.get(selectedCode) ?? genericEmoji)
    : closestOpenMoji(title, description);
  return {
    src: openMojiSvgUrl(emoji.hexcode),
    emoji: emoji.emoji,
  };
}
