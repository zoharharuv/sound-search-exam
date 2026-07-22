export const MAX_RECENT_SEARCHES = 5;

/** Produces a committed term's canonical whitespace form while retaining casing. */
export function normalizeSearchQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ");
}

/**
 * Moves a committed term to the front using case-insensitive identity while
 * preserving its newest display casing.
 */
export function addRecentSearch(
  history: readonly string[],
  query: string,
): string[] {
  const normalizedQuery = normalizeSearchQuery(query);

  if (!normalizedQuery) return [...history];

  const comparisonKey = normalizedQuery.trim().toLowerCase();
  const withoutDuplicate = history.filter(
    (item) => item.trim().toLowerCase() !== comparisonKey,
  );

  return [normalizedQuery, ...withoutDuplicate].slice(0, MAX_RECENT_SEARCHES);
}
