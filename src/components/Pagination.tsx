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
    <>
      <button disabled={!canGoPrevious} onClick={onPrevious} type="button">
        Previous
      </button>
      <button disabled={!canGoNext} onClick={onNext} type="button">
        Next
      </button>
      {isPending ? <span className="sr-only">Loading page</span> : null}
    </>
  );
}
