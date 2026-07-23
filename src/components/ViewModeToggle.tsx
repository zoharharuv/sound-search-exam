import type { ViewMode } from "@/storage/preferences-storage";

export interface ViewModeToggleProps {
  readonly viewMode: ViewMode;
  onViewModeChange(viewMode: ViewMode): void;
}

export function ViewModeToggle({
  viewMode,
  onViewModeChange,
}: ViewModeToggleProps) {
  return (
    <div
      aria-label="Result view"
      className="inline-flex rounded-xl border border-surface-border bg-slate-950/40 p-1"
      role="group"
    >
      {(["list", "tile"] as const).map((mode) => (
        <button
          aria-pressed={viewMode === mode}
          className={`min-h-10 rounded-lg px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            viewMode === mode
              ? "bg-accent text-white shadow"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
          key={mode}
          onClick={() => onViewModeChange(mode)}
          type="button"
        >
          {mode === "list" ? "List" : "Tile"}
        </button>
      ))}
    </div>
  );
}
