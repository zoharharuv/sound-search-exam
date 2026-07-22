import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Cursor } from "@/domain/pagination";
import {
  acceptLoadedPage,
  completePageTransition,
  initialPaginationState,
  resetPagination,
  type PaginationTransition,
} from "@/domain/pagination";

interface PageLoadedPayload {
  readonly cursor: Cursor | null;
  readonly nextCursor: Cursor | null;
}

interface PageTransitionSucceededPayload extends PaginationTransition {
  readonly nextCursor: Cursor | null;
}

// Redux coordinates navigation cursors; provider paging values stay opaque.
const paginationSlice = createSlice({
  name: "pagination",
  initialState: initialPaginationState,
  reducers: {
    paginationReset: () => resetPagination(),
    pageLoaded: (state, action: PayloadAction<PageLoadedPayload>) =>
      acceptLoadedPage(state, action.payload.cursor, action.payload.nextCursor),
    pageTransitionSucceeded: (
      state,
      action: PayloadAction<PageTransitionSucceededPayload>,
    ) =>
      completePageTransition(state, action.payload, action.payload.nextCursor),
  },
});

export const { pageLoaded, pageTransitionSucceeded, paginationReset } =
  paginationSlice.actions;
export const paginationReducer = paginationSlice.reducer;
