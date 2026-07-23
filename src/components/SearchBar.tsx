import type { FormEvent } from "react";

export interface SearchBarProps {
  readonly query: string;
  readonly isSearching: boolean;
  onQueryChange(query: string): void;
  onSubmit(): void;
}

export function SearchBar({
  query,
  isSearching,
  onQueryChange,
  onSubmit,
}: SearchBarProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form
      aria-busy={isSearching}
      className="mt-5 flex flex-col gap-3 sm:flex-row"
      onSubmit={handleSubmit}
      role="search"
    >
      <label className="sr-only" htmlFor="sound-search-query">
        Search sounds
      </label>
      <input
        id="sound-search-query"
        autoComplete="off"
        className="min-h-12 min-w-0 flex-1 rounded-xl border border-surface-border bg-slate-950/50 px-4 text-base text-white shadow-inner shadow-black/20 outline-none transition placeholder:text-slate-500 focus:border-accent focus:ring-4 focus:ring-accent/15"
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search sounds"
        type="search"
        value={query}
      />
      <button
        className="min-h-12 rounded-xl bg-accent px-6 font-semibold text-white shadow-lg shadow-accent/20 transition hover:bg-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-60"
        type="submit"
      >
        Go
      </button>
    </form>
  );
}
