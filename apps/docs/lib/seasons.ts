import type { DateGroup } from './updates-parser';

/** Seasons shown on the /updates landing (and its .md) before pagination. */
export const HOME_SEASON_LIMIT = 4;

export type SeasonKind = 'winter' | 'spring' | 'summer' | 'autumn';

export interface Season {
  kind: SeasonKind;
  /** URL slug: 'spring-2026', 'winter-2025-26' */
  slug: string;
  /** Human label: 'Весна 2026', 'Зима 2025–26' */
  label: string;
  emoji: string;
  /**
   * Sort key by season start (YYYY-MM). Newest season sorts first when
   * compared descending. Winter starts in December of its start year.
   */
  sortKey: string;
}

export interface SeasonGroup {
  season: Season;
  /** Date groups within the season, newest date first. */
  dates: DateGroup[];
}

const SEASON_META: Record<SeasonKind, { emoji: string; label: string }> = {
  spring: { emoji: '🌷', label: 'Весна' },
  summer: { emoji: '☀️', label: 'Лето' },
  autumn: { emoji: '🍁', label: 'Осень' },
  winter: { emoji: '❄️', label: 'Зима' },
};

/** Two-digit year suffix: 2026 → '26'. */
function shortYear(year: number): string {
  return String(year % 100).padStart(2, '0');
}

/**
 * Map an ISO date (YYYY-MM-DD) to its season.
 * Spring = Mar–May, Summer = Jun–Aug, Autumn = Sep–Nov,
 * Winter = Dec + Jan–Feb (spans two years, e.g. "Зима 2025–26").
 */
export function getSeason(date: string): Season {
  const [yearStr, monthStr] = date.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);

  if (month >= 3 && month <= 5) {
    return season('spring', year);
  }
  if (month >= 6 && month <= 8) {
    return season('summer', year);
  }
  if (month >= 9 && month <= 11) {
    return season('autumn', year);
  }
  // Winter: December belongs to the season starting that year;
  // January/February belong to the season that started the previous year.
  const startYear = month === 12 ? year : year - 1;
  return winterSeason(startYear);
}

function season(kind: Exclude<SeasonKind, 'winter'>, year: number): Season {
  const startMonth = kind === 'spring' ? '03' : kind === 'summer' ? '06' : '09';
  return {
    kind,
    slug: `${kind}-${year}`,
    label: `${SEASON_META[kind].label} ${year}`,
    emoji: SEASON_META[kind].emoji,
    sortKey: `${year}-${startMonth}`,
  };
}

function winterSeason(startYear: number): Season {
  const endYear = startYear + 1;
  return {
    kind: 'winter',
    slug: `winter-${startYear}-${shortYear(endYear)}`,
    label: `${SEASON_META.winter.label} ${startYear}–${shortYear(endYear)}`,
    emoji: SEASON_META.winter.emoji,
    sortKey: `${startYear}-12`,
  };
}

/**
 * Parse a season slug back into a Season, or null if malformed.
 * Accepts 'spring-2026' / 'summer-2025' / 'autumn-2024' / 'winter-2025-26'.
 */
export function parseSeasonSlug(slug: string): Season | null {
  const winterMatch = slug.match(/^winter-(\d{4})-(\d{2})$/);
  if (winterMatch) {
    const startYear = Number(winterMatch[1]);
    return winterSeason(startYear);
  }
  const match = slug.match(/^(spring|summer|autumn)-(\d{4})$/);
  if (match) {
    return season(match[1] as Exclude<SeasonKind, 'winter'>, Number(match[2]));
  }
  return null;
}

/**
 * Group date-grouped timeline entries into seasons, newest season first.
 * Input is the output of groupTimelineByDate (already sorted desc by date).
 */
export function groupBySeason(dateGroups: DateGroup[]): SeasonGroup[] {
  const bySlug = new Map<string, SeasonGroup>();

  for (const group of dateGroups) {
    const season = getSeason(group.date);
    let seasonGroup = bySlug.get(season.slug);
    if (!seasonGroup) {
      seasonGroup = { season, dates: [] };
      bySlug.set(season.slug, seasonGroup);
    }
    seasonGroup.dates.push(group);
  }

  return Array.from(bySlug.values()).sort((a, b) =>
    b.season.sortKey.localeCompare(a.season.sortKey)
  );
}
