import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ViewMode } from "@/storage/preferences-storage";

/** Persisted presentation preference, independent of fetched result data. */
export interface ViewModeState {
  readonly value: ViewMode;
}

const initialState: ViewModeState = { value: "list" };

const viewModeSlice = createSlice({
  name: "viewMode",
  initialState,
  reducers: {
    viewModeChanged(state, action: PayloadAction<ViewMode>) {
      state.value = action.payload;
    },
  },
});

export const { viewModeChanged } = viewModeSlice.actions;
export const viewModeReducer = viewModeSlice.reducer;
