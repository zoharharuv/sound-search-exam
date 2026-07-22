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

export const initialPaginationState: PaginationCursorState = {
  currentCursor: null,
  previousCursors: [],
  nextCursor: null,
};

export function resetPagination(): PaginationCursorState {
  return initialPaginationState;
}

export function setNextCursor(
  state: PaginationCursorState,
  nextCursor: Cursor | null,
): PaginationCursorState {
  return { ...state, nextCursor };
}

/**
 * Records the current cursor before advancing. Callers must invoke this only
 * when the requested page transition has succeeded.
 */
export function moveToNextPage(
  state: PaginationCursorState,
): PaginationCursorState {
  if (state.nextCursor === null) return state;

  return {
    currentCursor: state.nextCursor,
    previousCursors: [...state.previousCursors, state.currentCursor],
    nextCursor: null,
  };
}

/** Restores the most recently visited cursor without interpreting its value. */
export function moveToPreviousPage(
  state: PaginationCursorState,
): PaginationCursorState {
  const previousCursor = state.previousCursors.at(-1);
  if (previousCursor === undefined) return state;

  return {
    currentCursor: previousCursor,
    previousCursors: state.previousCursors.slice(0, -1),
    nextCursor: state.currentCursor,
  };
}
