import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  SoundProvider,
  SoundSearchInput,
  SoundSearchResult,
} from "@/api/sound-provider";
import { useSoundSearch } from "@/hooks/use-sound-search";
import { createAppStore, type AppStore } from "@/store/store";

interface Deferred<T> {
  readonly promise: Promise<T>;
  resolve(value: T): void;
  reject(reason: unknown): void;
}

function createDeferred<T>(): Deferred<T> {
  let resolvePromise: ((value: T) => void) | undefined;
  let rejectPromise: ((reason: unknown) => void) | undefined;
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  return {
    promise,
    resolve(value: T) {
      resolvePromise?.(value);
    },
    reject(reason: unknown) {
      rejectPromise?.(reason);
    },
  };
}

function soundResult(
  title: string,
  nextCursor: string | null = null,
): SoundSearchResult {
  const slug = title.toLowerCase().replace(/\s+/g, "-");
  return {
    items: [
      {
        id: `/${slug}/`,
        title,
        url: `https://sounds.test/${slug}/`,
        artworkUrl: null,
        embedUrl: `https://player.test/${slug}/`,
      },
    ],
    nextCursor,
  };
}

function createProvider(
  implementation: (input: SoundSearchInput) => Promise<SoundSearchResult>,
): SoundProvider & { search: ReturnType<typeof vi.fn> } {
  const search = vi.fn(implementation);
  return { id: "test-provider", search };
}

function createWrapper(store: AppStore, queryClient: QueryClient) {
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    );
  };
}

function createTestContext() {
  const store = createAppStore(null);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity } },
  });
  return { store, queryClient, wrapper: createWrapper(store, queryClient) };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("useSoundSearch", () => {
  it("debounces input for 300ms and records only the successful normalized query", async () => {
    vi.useFakeTimers();
    const provider = createProvider(async () => soundResult("Ambient result"));
    const { store, queryClient, wrapper } = createTestContext();
    const { result, unmount } = renderHook(() => useSoundSearch(provider), {
      wrapper,
    });

    act(() => result.current.setQuery("  Ambient   music  "));
    await act(async () => vi.advanceTimersByTimeAsync(299));
    expect(provider.search).not.toHaveBeenCalled();

    await act(async () => vi.advanceTimersByTimeAsync(1));
    await act(async () => vi.runOnlyPendingTimersAsync());
    vi.useRealTimers();
    await waitFor(() => expect(provider.search).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(store.getState().recentSearches.items).toEqual(["Ambient music"]),
    );
    expect(provider.search).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "Ambient music",
        cursor: null,
        pageSize: 6,
        signal: expect.any(AbortSignal),
      }),
    );

    unmount();
    queryClient.clear();
  });

  it("submits immediately and clears empty input without a request", async () => {
    const provider = createProvider(async () => soundResult("Jazz result"));
    const { store, queryClient, wrapper } = createTestContext();
    const { result, unmount } = renderHook(() => useSoundSearch(provider), {
      wrapper,
    });

    act(() => {
      result.current.setQuery("Jazz");
      result.current.submitSearch();
    });
    await waitFor(() => expect(provider.search).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(result.current.results[0]?.title).toBe("Jazz result"),
    );

    act(() => {
      result.current.setQuery("   ");
      result.current.submitSearch();
    });

    expect(provider.search).toHaveBeenCalledTimes(1);
    expect(result.current.activeQuery).toBe("");
    expect(store.getState().pagination).toEqual({
      currentCursor: null,
      previousCursors: [],
      nextCursor: null,
    });

    unmount();
    queryClient.clear();
  });

  it("aborts superseded work and prevents a late response from changing active data", async () => {
    const requests: Array<{
      readonly input: SoundSearchInput;
      readonly deferred: Deferred<SoundSearchResult>;
    }> = [];
    const provider = createProvider((input) => {
      const deferred = createDeferred<SoundSearchResult>();
      requests.push({ input, deferred });
      return deferred.promise;
    });
    const { store, queryClient, wrapper } = createTestContext();
    const { result, unmount } = renderHook(() => useSoundSearch(provider), {
      wrapper,
    });

    act(() => {
      result.current.setQuery("first");
      result.current.submitSearch();
    });
    await waitFor(() => expect(requests).toHaveLength(1));

    act(() => {
      result.current.setQuery("second");
      result.current.submitSearch();
    });
    await waitFor(() => expect(requests).toHaveLength(2));
    expect(requests[0]?.input.signal?.aborted).toBe(true);

    await act(async () => {
      requests[1]?.deferred.resolve(
        soundResult("Second result", "second-next"),
      );
      await Promise.resolve();
    });
    await waitFor(() =>
      expect(result.current.results[0]?.title).toBe("Second result"),
    );

    await act(async () => {
      requests[0]?.deferred.resolve(
        soundResult("Stale first result", "wrong-next"),
      );
      await Promise.resolve();
    });
    expect(result.current.results[0]?.title).toBe("Second result");
    expect(store.getState().pagination.nextCursor).toBe("second-next");
    expect(store.getState().recentSearches.items).toEqual(["second"]);

    unmount();
    queryClient.clear();
  });

  it("locks rapid Next clicks and commits cursor history only after success", async () => {
    const nextPage = createDeferred<SoundSearchResult>();
    const provider = createProvider((input) => {
      if (input.cursor === null) {
        return Promise.resolve(soundResult("Page one", "cursor-2"));
      }
      return nextPage.promise;
    });
    const { store, queryClient, wrapper } = createTestContext();
    const { result, unmount } = renderHook(() => useSoundSearch(provider), {
      wrapper,
    });

    act(() => {
      result.current.setQuery("pages");
      result.current.submitSearch();
    });
    await waitFor(() => expect(result.current.canGoNext).toBe(true));

    act(() => {
      result.current.goToNextPage();
      result.current.goToNextPage();
    });
    await waitFor(() => expect(provider.search).toHaveBeenCalledTimes(2));
    expect(store.getState().pagination.currentCursor).toBeNull();
    expect(store.getState().pagination.previousCursors).toEqual([]);
    expect(result.current.canGoNext).toBe(false);

    await act(async () => {
      nextPage.resolve(soundResult("Page two", "cursor-3"));
      await Promise.resolve();
    });
    await waitFor(() =>
      expect(store.getState().pagination).toEqual({
        currentCursor: "cursor-2",
        previousCursors: [null],
        nextCursor: "cursor-3",
      }),
    );
    expect(result.current.results[0]?.title).toBe("Page two");
    expect(store.getState().recentSearches.items).toEqual(["pages"]);
    expect(
      queryClient
        .getQueryCache()
        .getAll()
        .map((query) => query.queryKey),
    ).toEqual(
      expect.arrayContaining([
        ["sound-search", "test-provider", "pages", null],
        ["sound-search", "test-provider", "pages", "cursor-2"],
      ]),
    );

    unmount();
    queryClient.clear();
  });
});
