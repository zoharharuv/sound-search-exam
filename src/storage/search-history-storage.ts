import { MAX_RECENT_SEARCHES } from "@/domain/search-history";

/** Minimal storage contract keeps persistence adapters testable without a browser. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const SEARCH_HISTORY_KEY = "sound-search:recent-searches";

function browserStorage(): KeyValueStorage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

/** Reads only valid string entries and treats unavailable or malformed storage as empty. */
export function loadSearchHistory(
  storage: KeyValueStorage | null = browserStorage(),
): string[] {
  if (!storage) return [];

  try {
    const parsed: unknown = JSON.parse(
      storage.getItem(SEARCH_HISTORY_KEY) ?? "[]",
    );
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is string => typeof item === "string")
      .slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}

/** Persists the domain limit without allowing storage failures to reach the UI. */
export function saveSearchHistory(
  history: readonly string[],
  storage: KeyValueStorage | null = browserStorage(),
): void {
  if (!storage) return;

  try {
    storage.setItem(
      SEARCH_HISTORY_KEY,
      JSON.stringify(history.slice(0, MAX_RECENT_SEARCHES)),
    );
  } catch {
    // Storage may be unavailable or full; persistence must not break the UI.
  }
}
