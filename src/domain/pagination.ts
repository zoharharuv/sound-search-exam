/** Provider-neutral paging value that consumers must store without interpreting. */
export type Cursor = string;

/**
 * Client-owned cursor history. Entries are ordered from the first visited page
 * to the page immediately preceding `currentCursor`.
 */
export interface PaginationCursorState {
  readonly currentCursor: Cursor | null;
  readonly previousCursors: readonly (Cursor | null)[];
  readonly nextCursor: Cursor | null;
}

export type PaginationDirection = "next" | "previous";

/** A page change that is committed only after its request succeeds. */
export interface PaginationTransition {
  readonly direction: PaginationDirection;
  readonly fromCursor: Cursor | null;
  readonly targetCursor: Cursor | null;
}

export const initialPaginationState: PaginationCursorState = {
  currentCursor: null,
  previousCursors: [],
  nextCursor: null,
};

export function resetPagination(): PaginationCursorState {
  return initialPaginationState;
}

export function acceptLoadedPage(
  state: PaginationCursorState,
  cursor: Cursor | null,
  nextCursor: Cursor | null,
): PaginationCursorState {
  if (state.currentCursor !== cursor) return state;

  return { ...state, nextCursor };
}

/**
 * Commits a successful transition only if it still matches the current state.
 * This prevents duplicate or out-of-order responses from corrupting history.
 */
export function completePageTransition(
  state: PaginationCursorState,
  transition: PaginationTransition,
  nextCursor: Cursor | null,
): PaginationCursorState {
  if (state.currentCursor !== transition.fromCursor) return state;

  if (transition.direction === "next") {
    if (
      transition.targetCursor === null ||
      state.nextCursor !== transition.targetCursor
    ) {
      return state;
    }

    return {
      currentCursor: transition.targetCursor,
      previousCursors: [...state.previousCursors, transition.fromCursor],
      nextCursor,
    };
  }

  const expectedPreviousCursor = state.previousCursors.at(-1);
  if (
    expectedPreviousCursor === undefined ||
    expectedPreviousCursor !== transition.targetCursor
  ) {
    return state;
  }

  return {
    currentCursor: transition.targetCursor,
    previousCursors: state.previousCursors.slice(0, -1),
    nextCursor,
  };
}
