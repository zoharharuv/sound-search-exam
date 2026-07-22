import { type FormEvent, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import {
  nextPageRequested,
  previousPageRequested,
} from "@/store/pagination-slice";
import { viewModeChanged } from "@/store/view-mode-slice";

export function SoundSearchPage() {
  const dispatch = useDispatch<AppDispatch>();
  const recentSearches = useSelector(
    (state: RootState) => state.recentSearches.items,
  );
  const pagination = useSelector((state: RootState) => state.pagination);
  const viewMode = useSelector((state: RootState) => state.viewMode.value);
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <main className="mx-auto flex min-h-full max-w-5xl flex-col gap-8 p-6">
      <header>
        <h1 className="text-3xl font-semibold">Sound Search</h1>
      </header>

      <section aria-labelledby="search-heading">
        <h2 id="search-heading" className="text-xl font-medium">
          Search
        </h2>
        <form className="mt-3 flex gap-3" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="sound-search-query">
            Search sounds
          </label>
          <input
            id="sound-search-query"
            className="min-w-0 flex-1 rounded border border-surface-border bg-surface-raised px-3 py-2"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search sounds"
            type="search"
            value={query}
          />
          <button className="rounded bg-accent px-4 py-2" type="submit">
            Go
          </button>
        </form>
      </section>

      <section aria-labelledby="results-heading">
        <h2 id="results-heading" className="text-xl font-medium">
          Search results
        </h2>
        <p className="mt-3 text-slate-400">Search results will appear here.</p>
        <nav aria-label="Search result controls" className="mt-4 flex gap-3">
          <button
            disabled={pagination.previousCursors.length === 0}
            onClick={() => dispatch(previousPageRequested())}
            type="button"
          >
            Previous
          </button>
          <button
            disabled={pagination.nextCursor === null}
            onClick={() => dispatch(nextPageRequested())}
            type="button"
          >
            Next
          </button>
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
                <button onClick={() => setQuery(recentQuery)} type="button">
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
