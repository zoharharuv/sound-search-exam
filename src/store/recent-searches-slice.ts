import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { addRecentSearch } from "@/domain/search-history";

/** Client-owned history; search results themselves remain in React Query. */
export interface RecentSearchesState {
  readonly items: readonly string[];
}

const initialState: RecentSearchesState = { items: [] };

const recentSearchesSlice = createSlice({
  name: "recentSearches",
  initialState,
  reducers: {
    successfulSearchRecorded(state, action: PayloadAction<string>) {
      state.items = addRecentSearch(state.items, action.payload);
    },
  },
});

export const { successfulSearchRecorded } = recentSearchesSlice.actions;
export const recentSearchesReducer = recentSearchesSlice.reducer;
