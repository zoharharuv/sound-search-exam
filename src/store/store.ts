import { configureStore } from "@reduxjs/toolkit";
import {
  loadSearchHistory,
  saveSearchHistory,
  type KeyValueStorage,
} from "@/storage/search-history-storage";
import { loadViewMode, saveViewMode } from "@/storage/preferences-storage";
import { paginationReducer } from "./pagination-slice";
import { recentSearchesReducer } from "./recent-searches-slice";
import { viewModeReducer } from "./view-mode-slice";

/**
 * Creates the client-state store and hydrates only persisted UI state.
 * Fetched search pages remain owned by React Query and are never copied here.
 */
export function createAppStore(storage?: KeyValueStorage | null) {
  const appStore = configureStore({
    reducer: {
      recentSearches: recentSearchesReducer,
      pagination: paginationReducer,
      viewMode: viewModeReducer,
    },
    preloadedState: {
      recentSearches: { items: loadSearchHistory(storage) },
      viewMode: { value: loadViewMode(storage) },
    },
  });

  // Persistence is centralized here so slices and views stay storage-agnostic.
  appStore.subscribe(() => {
    const state = appStore.getState();
    saveSearchHistory(state.recentSearches.items, storage);
    saveViewMode(state.viewMode.value, storage);
  });

  return appStore;
}

export const store = createAppStore();
export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
