export interface PaginationProps {
  readonly canGoPrevious: boolean;
  readonly canGoNext: boolean;
  readonly isPending: boolean;
  onPrevious(): void;
  onNext(): void;
}

export function Pagination({
  canGoPrevious,
  canGoNext,
  isPending,
  onPrevious,
  onNext,
}: PaginationProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        className="min-h-10 rounded-xl border border-surface-border bg-slate-950/40 px-3 text-sm font-semibold text-slate-200 transition hover:border-accent/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!canGoPrevious}
        onClick={onPrevious}
        type="button"
      >
        Previous
      </button>
      <button
        className="min-h-10 rounded-xl border border-surface-border bg-slate-950/40 px-3 text-sm font-semibold text-slate-200 transition hover:border-accent/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!canGoNext}
        onClick={onNext}
        type="button"
      >
        Next
      </button>
      {isPending ? <span className="sr-only">Loading page</span> : null}
    </div>
  );
}
