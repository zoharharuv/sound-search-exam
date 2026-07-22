import type { KeyValueStorage } from "./search-history-storage";

export type ViewMode = "list" | "tile";

const PREFERENCES_KEY = "sound-search:preferences";

function browserStorage(): KeyValueStorage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

/** Loads a validated preference and falls back to the stable default. */
export function loadViewMode(
  storage: KeyValueStorage | null = browserStorage(),
): ViewMode {
  if (!storage) return "list";

  try {
    const parsed: unknown = JSON.parse(
      storage.getItem(PREFERENCES_KEY) ?? "{}",
    );
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "viewMode" in parsed &&
      (parsed.viewMode === "list" || parsed.viewMode === "tile")
    ) {
      return parsed.viewMode;
    }
  } catch {
    // Invalid or inaccessible preferences fall back to defaults.
  }

  return "list";
}

/** Persists client preference changes without coupling views to localStorage. */
export function saveViewMode(
  viewMode: ViewMode,
  storage: KeyValueStorage | null = browserStorage(),
): void {
  if (!storage) return;

  try {
    storage.setItem(PREFERENCES_KEY, JSON.stringify({ viewMode }));
  } catch {
    // Storage may be unavailable or full; persistence must not break the UI.
  }
}
