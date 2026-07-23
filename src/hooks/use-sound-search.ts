import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { isApiRequestCancelled } from "@/api/http-client";
import { soundProvider } from "@/api/provider";
import {
  MAX_SEARCH_PAGE_SIZE,
  type SoundProvider,
  type SoundSearchResult,
} from "@/api/sound-provider";
import type {
  Cursor,
  PaginationDirection,
  PaginationTransition,
} from "@/domain/pagination";
import { normalizeSearchQuery } from "@/domain/search-history";
import type { Sound } from "@/domain/sound";
import {
  pageLoaded,
  pageTransitionSucceeded,
  paginationReset,
} from "@/store/pagination-slice";
import { successfulSearchRecorded } from "@/store/recent-searches-slice";
import type { AppDispatch, RootState } from "@/store/store";

const SEARCH_DEBOUNCE_MS = 300;
const SOUND_SEARCH_QUERY_ROOT = "sound-search";

type SoundSearchQueryKey = readonly [
  typeof SOUND_SEARCH_QUERY_ROOT,
  string,
  string,
  Cursor | null,
];

interface PendingSearchHistory {
  readonly query: string;
  readonly queryKey: SoundSearchQueryKey;
  readonly baselineDataUpdateCount: number;
}

interface PendingNavigation extends PaginationTransition {
  readonly query: string;
  readonly queryKey: SoundSearchQueryKey;
}

export interface UseSoundSearchResult {
  readonly query: string;
  readonly activeQuery: string;
  readonly results: readonly Sound[];
  readonly hasSearched: boolean;
  readonly isLoading: boolean;
  readonly isEmpty: boolean;
  readonly errorMessage: string | null;
  readonly canGoPrevious: boolean;
  readonly canGoNext: boolean;
  readonly isNavigationPending: boolean;
  setQuery(query: string): void;
  submitSearch(): void;
  searchRecent(query: string): void;
  retry(): void;
  goToPreviousPage(): void;
  goToNextPage(): void;
}

function createSoundSearchQueryKey(
  providerId: string,
  query: string,
  cursor: Cursor | null,
): SoundSearchQueryKey {
  return [SOUND_SEARCH_QUERY_ROOT, providerId, query, cursor];
}

function getDataUpdateCount(
  queryClient: QueryClient,
  queryKey: SoundSearchQueryKey,
): number {
  return (
    queryClient.getQueryState<SoundSearchResult>(queryKey)?.dataUpdateCount ?? 0
  );
}

export function useSoundSearch(
  provider: SoundProvider = soundProvider,
): UseSoundSearchResult {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const pagination = useSelector((state: RootState) => state.pagination);
  const [query, setQueryState] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [requestedCursor, setRequestedCursor] = useState<Cursor | null>(null);
  const [pendingNavigation, setPendingNavigation] =
    useState<PendingNavigation | null>(null);

  const queryRef = useRef(query);
  const activeQueryRef = useRef(activeQuery);
  const requestedCursorRef = useRef(requestedCursor);
  const debounceTimerRef = useRef<number | null>(null);
  const skipNextDebounceRef = useRef(false);
  const navigationLockRef = useRef(false);
  const pendingHistoryRef = useRef<PendingSearchHistory | null>(null);

  queryRef.current = query;
  activeQueryRef.current = activeQuery;
  requestedCursorRef.current = requestedCursor;

  const queryKey = useMemo(
    () => createSoundSearchQueryKey(provider.id, activeQuery, requestedCursor),
    [activeQuery, provider.id, requestedCursor],
  );

  const searchQuery = useQuery({
    queryKey,
    queryFn: ({ queryKey: requestQueryKey, signal }) => {
      const [, , requestQuery, requestCursor] = requestQueryKey;

      return provider.search({
        query: requestQuery,
        cursor: requestCursor,
        pageSize: MAX_SEARCH_PAGE_SIZE,
        signal,
      });
    },
    enabled: activeQuery !== "",
    staleTime: 0,
    retry: false,
  });

  const clearDebounce = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const clearSearch = useCallback(() => {
    clearDebounce();
    pendingHistoryRef.current = null;
    navigationLockRef.current = false;
    activeQueryRef.current = "";
    requestedCursorRef.current = null;
    setPendingNavigation(null);
    setActiveQuery("");
    setRequestedCursor(null);
    dispatch(paginationReset());
    void queryClient.cancelQueries(
      { queryKey: [SOUND_SEARCH_QUERY_ROOT, provider.id] },
      { silent: true },
    );
  }, [clearDebounce, dispatch, provider.id, queryClient]);

  const beginSearch = useCallback(
    (nextQuery: string) => {
      const nextQueryKey = createSoundSearchQueryKey(
        provider.id,
        nextQuery,
        null,
      );
      const isSameActiveFirstPage =
        activeQueryRef.current === nextQuery &&
        requestedCursorRef.current === null;

      pendingHistoryRef.current = {
        query: nextQuery,
        queryKey: nextQueryKey,
        baselineDataUpdateCount: getDataUpdateCount(queryClient, nextQueryKey),
      };
      navigationLockRef.current = false;
      activeQueryRef.current = nextQuery;
      requestedCursorRef.current = null;
      setPendingNavigation(null);
      dispatch(paginationReset());
      setActiveQuery(nextQuery);
      setRequestedCursor(null);

      if (isSameActiveFirstPage) {
        void queryClient.invalidateQueries({
          queryKey: nextQueryKey,
          exact: true,
        });
      } else {
        void queryClient.cancelQueries(
          { queryKey: [SOUND_SEARCH_QUERY_ROOT, provider.id] },
          { silent: true },
        );
      }
    },
    [dispatch, provider.id, queryClient],
  );

  useEffect(() => {
    clearDebounce();

    if (skipNextDebounceRef.current) {
      skipNextDebounceRef.current = false;
      return undefined;
    }

    const normalizedQuery = normalizeSearchQuery(query);
    if (!normalizedQuery) {
      clearSearch();
      return undefined;
    }

    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null;
      beginSearch(normalizedQuery);
    }, SEARCH_DEBOUNCE_MS);

    return clearDebounce;
  }, [beginSearch, clearDebounce, clearSearch, query]);

  useEffect(() => {
    if (
      activeQuery === "" ||
      !searchQuery.isSuccess ||
      searchQuery.fetchStatus !== "idle" ||
      !searchQuery.data
    ) {
      return;
    }

    const currentDataUpdateCount = getDataUpdateCount(queryClient, queryKey);

    if (pendingNavigation) {
      const isCurrentTransition =
        pendingNavigation.query === activeQuery &&
        pendingNavigation.targetCursor === requestedCursor &&
        pendingNavigation.queryKey.every(
          (part, index) => part === queryKey[index],
        );

      if (!isCurrentTransition) {
        return;
      }

      dispatch(
        pageTransitionSucceeded({
          direction: pendingNavigation.direction,
          fromCursor: pendingNavigation.fromCursor,
          targetCursor: pendingNavigation.targetCursor,
          nextCursor: searchQuery.data.nextCursor,
        }),
      );
      navigationLockRef.current = false;
      setPendingNavigation(null);
      return;
    }

    if (requestedCursor !== pagination.currentCursor) return;

    dispatch(
      pageLoaded({
        cursor: requestedCursor,
        nextCursor: searchQuery.data.nextCursor,
      }),
    );

    const pendingHistory = pendingHistoryRef.current;
    if (
      requestedCursor === null &&
      pendingHistory?.query === activeQuery &&
      pendingHistory.queryKey.every(
        (part, index) => part === queryKey[index],
      ) &&
      currentDataUpdateCount > pendingHistory.baselineDataUpdateCount
    ) {
      dispatch(successfulSearchRecorded(activeQuery));
      pendingHistoryRef.current = null;
    }
  }, [
    activeQuery,
    dispatch,
    pagination.currentCursor,
    pendingNavigation,
    queryClient,
    queryKey,
    requestedCursor,
    searchQuery.data,
    searchQuery.fetchStatus,
    searchQuery.isSuccess,
  ]);

  const setQuery = useCallback((nextQuery: string) => {
    queryRef.current = nextQuery;
    setQueryState(nextQuery);
  }, []);

  const submitSearch = useCallback(() => {
    clearDebounce();
    const normalizedQuery = normalizeSearchQuery(queryRef.current);
    if (!normalizedQuery) {
      clearSearch();
      return;
    }

    beginSearch(normalizedQuery);
  }, [beginSearch, clearDebounce, clearSearch]);

  const searchRecent = useCallback(
    (recentQuery: string) => {
      clearDebounce();
      const normalizedQuery = normalizeSearchQuery(recentQuery);
      if (!normalizedQuery) {
        clearSearch();
        return;
      }

      if (queryRef.current !== normalizedQuery) {
        skipNextDebounceRef.current = true;
        queryRef.current = normalizedQuery;
        setQueryState(normalizedQuery);
      }
      beginSearch(normalizedQuery);
    },
    [beginSearch, clearDebounce, clearSearch],
  );

  const beginNavigation = useCallback(
    (direction: PaginationDirection, targetCursor: Cursor | null) => {
      if (navigationLockRef.current || activeQueryRef.current === "") return;

      navigationLockRef.current = true;
      const transitionQuery = activeQueryRef.current;
      const transitionQueryKey = createSoundSearchQueryKey(
        provider.id,
        transitionQuery,
        targetCursor,
      );
      const transition: PendingNavigation = {
        direction,
        query: transitionQuery,
        fromCursor: pagination.currentCursor,
        targetCursor,
        queryKey: transitionQueryKey,
      };

      requestedCursorRef.current = targetCursor;
      setPendingNavigation(transition);
      setRequestedCursor(targetCursor);
    },
    [pagination.currentCursor, provider.id, queryClient],
  );

  const goToNextPage = useCallback(() => {
    if (
      !searchQuery.isSuccess ||
      searchQuery.isFetching ||
      pendingNavigation ||
      pagination.nextCursor === null
    ) {
      return;
    }
    beginNavigation("next", pagination.nextCursor);
  }, [
    beginNavigation,
    pagination.nextCursor,
    pendingNavigation,
    searchQuery.isFetching,
    searchQuery.isSuccess,
  ]);

  const goToPreviousPage = useCallback(() => {
    if (!searchQuery.isSuccess || searchQuery.isFetching || pendingNavigation) {
      return;
    }

    const previousCursor = pagination.previousCursors.at(-1);
    if (previousCursor === undefined) return;
    beginNavigation("previous", previousCursor);
  }, [
    beginNavigation,
    pagination.previousCursors,
    pendingNavigation,
    searchQuery.isFetching,
    searchQuery.isSuccess,
  ]);

  const retry = useCallback(() => {
    void searchQuery.refetch({ cancelRefetch: true });
  }, [searchQuery]);

  const hasSearched = activeQuery !== "";
  const hasVisibleError =
    searchQuery.isError && !isApiRequestCancelled(searchQuery.error);
  const isLoading =
    hasSearched &&
    !hasVisibleError &&
    (searchQuery.isPending || searchQuery.isFetching);
  const results = searchQuery.data?.items ?? [];
  const isNavigationPending = pendingNavigation !== null;
  const navigationDisabled =
    isNavigationPending || searchQuery.isFetching || !searchQuery.isSuccess;

  return {
    query,
    activeQuery,
    results,
    hasSearched,
    isLoading,
    isEmpty:
      hasSearched &&
      searchQuery.isSuccess &&
      !searchQuery.isFetching &&
      results.length === 0,
    errorMessage: hasVisibleError
      ? "Unable to search sounds. Please try again."
      : null,
    canGoPrevious: !navigationDisabled && pagination.previousCursors.length > 0,
    canGoNext: !navigationDisabled && pagination.nextCursor !== null,
    isNavigationPending,
    setQuery,
    submitSearch,
    searchRecent,
    retry,
    goToPreviousPage,
    goToNextPage,
  };
}
