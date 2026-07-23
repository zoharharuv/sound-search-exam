import { useState } from "react";

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
  const [lastActivatedDirection, setLastActivatedDirection] = useState<
    "previous" | "next" | null
  >(null);

  function isUnavailable(direction: "previous" | "next") {
    return (
      isPending ||
      (direction === "previous" ? !canGoPrevious : !canGoNext)
    );
  }

  function isNativelyDisabled(direction: "previous" | "next") {
    return (
      isUnavailable(direction) && lastActivatedDirection !== direction
    );
  }

  function handleActivation(direction: "previous" | "next") {
    if (isUnavailable(direction)) return;

    setLastActivatedDirection(direction);
    if (direction === "previous") {
      onPrevious();
    } else {
      onNext();
    }
  }

  return (
    <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
      <button
        aria-disabled={isUnavailable("previous")}
        className="min-h-10 min-w-0 flex-1 rounded-xl border border-surface-border bg-slate-950/40 px-3 text-sm font-semibold text-slate-200 transition hover:border-accent/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40 aria-disabled:cursor-not-allowed aria-disabled:opacity-40 min-[420px]:flex-none"
        disabled={isNativelyDisabled("previous")}
        onClick={() => handleActivation("previous")}
        type="button"
      >
        Previous
      </button>
      <button
        aria-disabled={isUnavailable("next")}
        className="min-h-10 min-w-0 flex-1 rounded-xl border border-surface-border bg-slate-950/40 px-3 text-sm font-semibold text-slate-200 transition hover:border-accent/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40 aria-disabled:cursor-not-allowed aria-disabled:opacity-40 min-[420px]:flex-none"
        disabled={isNativelyDisabled("next")}
        onClick={() => handleActivation("next")}
        type="button"
      >
        Next
      </button>
      {isPending ? <span className="sr-only">Loading page</span> : null}
    </div>
  );
}
