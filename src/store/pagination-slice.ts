import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Cursor } from "@/domain/pagination";
import {
  initialPaginationState,
  moveToNextPage,
  moveToPreviousPage,
  resetPagination,
  setNextCursor,
} from "@/domain/pagination";

// Redux coordinates navigation cursors; provider paging values stay opaque.
const paginationSlice = createSlice({
  name: "pagination",
  initialState: initialPaginationState,
  reducers: {
    paginationReset: () => resetPagination(),
    nextCursorReceived: (state, action: PayloadAction<Cursor | null>) =>
      setNextCursor(state, action.payload),
    nextPageRequested: (state) => moveToNextPage(state),
    previousPageRequested: (state) => moveToPreviousPage(state),
  },
});

export const {
  nextCursorReceived,
  nextPageRequested,
  paginationReset,
  previousPageRequested,
} = paginationSlice.actions;
export const paginationReducer = paginationSlice.reducer;
