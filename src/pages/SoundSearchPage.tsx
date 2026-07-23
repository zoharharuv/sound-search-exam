import { useCallback, useEffect, useState } from "react";
import { LayoutGroup, MotionConfig, useReducedMotion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { Pagination } from "@/components/Pagination";
import { SearchBar } from "@/components/SearchBar";
import { SearchResults } from "@/components/SearchResults";
import { SoundPreview } from "@/components/SoundPreview";
import { ViewModeToggle } from "@/components/ViewModeToggle";
import type { Sound } from "@/domain/sound";
import { useSoundSearch } from "@/hooks/use-sound-search";
import type { AppDispatch, RootState } from "@/store/store";
import { viewModeChanged } from "@/store/view-mode-slice";

export function SoundSearchPage() {
  const dispatch = useDispatch<AppDispatch>();
  const recentSearches = useSelector(
    (state: RootState) => state.recentSearches.items,
  );
  const viewMode = useSelector((state: RootState) => state.viewMode.value);
  const search = useSoundSearch();
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [selectedSound, setSelectedSound] = useState<Sound | null>(null);
  const [isPlayerMounted, setIsPlayerMounted] = useState(false);

  const clearPreview = useCallback(() => {
    setSelectedSound(null);
    setIsPlayerMounted(false);
  }, []);

  useEffect(() => {
    if (!selectedSound) return;

    const selectionIsVisible = search.results.some(
      (sound) => sound === selectedSound,
    );
    if (
      !selectionIsVisible ||
      search.isLoading ||
      search.isEmpty ||
      search.errorMessage !== null
    ) {
      clearPreview();
    }
  }, [
    clearPreview,
    search.errorMessage,
    search.isEmpty,
    search.isLoading,
    search.results,
    selectedSound,
  ]);

  function handleQueryChange(nextQuery: string) {
    clearPreview();
    search.setQuery(nextQuery);
  }

  function handleSubmit() {
    clearPreview();
    search.submitSearch();
  }

  function handleRecentSearch(recentQuery: string) {
    clearPreview();
    search.searchRecent(recentQuery);

    if (window.innerWidth < 1024) {
      window.scrollTo({
        top: 0,
        behavior: shouldReduceMotion ? "auto" : "smooth",
      });
    }
  }

  function handleRetry() {
    clearPreview();
    search.retry();
  }

  function handlePrevious() {
    clearPreview();
    search.goToPreviousPage();
  }

  function handleNext() {
    clearPreview();
    search.goToNextPage();
  }

  function handleSelect(sound: Sound) {
    setSelectedSound(sound);
    setIsPlayerMounted(false);
  }

  function handleRequestPlayer() {
    if (selectedSound !== null && selectedSound.embedUrl !== null) {
      setIsPlayerMounted(true);
    }
  }

  return (
    <main className="mx-auto min-h-full w-full max-w-[90rem] px-2 py-5 min-[420px]:px-4 min-[420px]:py-8 min-[600px]:px-6 lg:px-8 lg:py-12">
      <header className="mb-5 max-w-3xl min-[420px]:mb-8">
        <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-blue-300 min-[420px]:mb-3 min-[420px]:text-xs min-[420px]:tracking-[0.24em]">
          Discover something worth hearing
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white min-[420px]:text-4xl min-[600px]:text-5xl">
          Sound Search
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 min-[420px]:mt-4 min-[420px]:text-base min-[420px]:leading-7">
          Search mixes, move through provider pages, and choose artwork to load
          the player.
        </p>
      </header>

      <MotionConfig reducedMotion="user">
        <LayoutGroup id="sound-selection">
          <div className="grid min-w-0 items-start gap-3 min-[420px]:gap-4 min-[600px]:gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)_minmax(14rem,0.6fr)]">
            <section
              aria-labelledby="search-heading"
              className="min-w-0 rounded-2xl border border-white/10 bg-surface-raised/90 p-3 shadow-2xl shadow-black/20 backdrop-blur min-[420px]:rounded-3xl min-[420px]:p-5 min-[600px]:p-6"
            >
              <div className="flex min-w-0 items-start justify-between gap-2 min-[420px]:gap-4">
                <div>
                  <h2
                    className="text-xl font-semibold text-white"
                    id="search-heading"
                  >
                    Search
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Results update after a short pause, or press Go.
                  </p>
                </div>
                {search.activeQuery ? (
                  <span className="hidden max-w-40 truncate rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-blue-200 min-[600px]:block">
                    {search.activeQuery}
                  </span>
                ) : null}
              </div>
              <SearchBar
                isSearching={search.isLoading}
                onQueryChange={handleQueryChange}
                onSubmit={handleSubmit}
                query={search.query}
              />

              <div className="mt-5 min-w-0 border-t border-white/10 pt-4 min-[420px]:mt-7 min-[420px]:pt-6">
                <h2
                  className="text-lg font-semibold text-white"
                  id="results-heading"
                >
                  Search results
                </h2>
                <SearchResults
                  errorMessage={search.errorMessage}
                  hasSearched={search.hasSearched}
                  isEmpty={search.isEmpty}
                  isLoading={search.isLoading}
                  onRetry={handleRetry}
                  onSelect={handleSelect}
                  results={search.results}
                  selectedSoundId={selectedSound?.id ?? null}
                  shouldReduceMotion={shouldReduceMotion}
                  viewMode={viewMode}
                />
              </div>

              <nav
                aria-label="Search result controls"
                className="mt-5 flex min-w-0 flex-col items-stretch gap-3 border-t border-white/10 pt-4 min-[420px]:mt-6 min-[420px]:flex-row min-[420px]:flex-wrap min-[420px]:items-center min-[420px]:justify-between min-[420px]:pt-5"
              >
                <Pagination
                  canGoNext={search.canGoNext}
                  canGoPrevious={search.canGoPrevious}
                  isPending={search.isNavigationPending}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                />
                <ViewModeToggle
                  onViewModeChange={(mode) => dispatch(viewModeChanged(mode))}
                  viewMode={viewMode}
                />
              </nav>
            </section>

            <section
              aria-labelledby="preview-heading"
              className="min-w-0 rounded-2xl border border-white/10 bg-surface-raised/90 p-3 shadow-2xl shadow-black/20 backdrop-blur min-[420px]:rounded-3xl min-[420px]:p-5 min-[600px]:p-6"
            >
              <h2
                className="text-xl font-semibold text-white"
                id="preview-heading"
              >
                Track preview
              </h2>
              <SoundPreview
                isPlayerMounted={isPlayerMounted}
                onRequestPlayer={handleRequestPlayer}
                shouldReduceMotion={shouldReduceMotion}
                sound={selectedSound}
              />
            </section>

            <aside
              aria-labelledby="recent-heading"
              className="min-w-0 rounded-2xl border border-white/10 bg-surface-raised/90 p-3 shadow-2xl shadow-black/20 backdrop-blur min-[420px]:rounded-3xl min-[420px]:p-5 min-[600px]:p-6"
            >
              <h2
                className="text-xl font-semibold text-white"
                id="recent-heading"
              >
                Recent searches
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Your five latest successful searches.
              </p>
              {recentSearches.length === 0 ? (
                <p className="mt-5 rounded-xl border border-dashed border-surface-border px-3 py-5 text-center text-sm text-slate-500">
                  No recent searches.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {recentSearches.map((recentQuery) => (
                    <li key={recentQuery}>
                      <button
                        className="min-h-11 w-full min-w-0 max-w-full truncate rounded-xl border border-transparent bg-slate-950/30 px-3 text-left text-sm text-slate-300 transition hover:border-accent/40 hover:bg-accent/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        onClick={() => handleRecentSearch(recentQuery)}
                        type="button"
                      >
                        {recentQuery}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          </div>
        </LayoutGroup>
      </MotionConfig>
    </main>
  );
}
