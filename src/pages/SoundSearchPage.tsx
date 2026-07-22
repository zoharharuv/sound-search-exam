import { useDispatch, useSelector } from "react-redux";
import { Pagination } from "@/components/Pagination";
import { SearchBar } from "@/components/SearchBar";
import { SearchResults } from "@/components/SearchResults";
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

  return (
    <main className="mx-auto flex min-h-full max-w-5xl flex-col gap-8 p-6">
      <header>
        <h1 className="text-3xl font-semibold">Sound Search</h1>
      </header>

      <section aria-labelledby="search-heading">
        <h2 id="search-heading" className="text-xl font-medium">
          Search
        </h2>
        <SearchBar
          isSearching={search.isLoading}
          onQueryChange={search.setQuery}
          onSubmit={search.submitSearch}
          query={search.query}
        />
      </section>

      <section aria-labelledby="results-heading">
        <h2 id="results-heading" className="text-xl font-medium">
          Search results
        </h2>
        <SearchResults
          errorMessage={search.errorMessage}
          hasSearched={search.hasSearched}
          isEmpty={search.isEmpty}
          isLoading={search.isLoading}
          onRetry={search.retry}
          results={search.results}
        />
        <nav aria-label="Search result controls" className="mt-4 flex gap-3">
          <Pagination
            canGoNext={search.canGoNext}
            canGoPrevious={search.canGoPrevious}
            isPending={search.isNavigationPending}
            onNext={search.goToNextPage}
            onPrevious={search.goToPreviousPage}
          />
          <button
            aria-pressed={viewMode === "list"}
            onClick={() => dispatch(viewModeChanged("list"))}
            type="button"
          >
            List
          </button>
          <button
            aria-pressed={viewMode === "tile"}
            onClick={() => dispatch(viewModeChanged("tile"))}
            type="button"
          >
            Tile
          </button>
        </nav>
      </section>

      <section aria-labelledby="preview-heading">
        <h2 id="preview-heading" className="text-xl font-medium">
          Track preview
        </h2>
        <p className="mt-3 text-slate-400">Select a result to preview it.</p>
      </section>

      <aside aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="text-xl font-medium">
          Recent searches
        </h2>
        {recentSearches.length === 0 ? (
          <p className="mt-3 text-slate-400">No recent searches.</p>
        ) : (
          <ul className="mt-3">
            {recentSearches.map((recentQuery) => (
              <li key={recentQuery}>
                <button
                  onClick={() => search.searchRecent(recentQuery)}
                  type="button"
                >
                  {recentQuery}
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </main>
  );
}
