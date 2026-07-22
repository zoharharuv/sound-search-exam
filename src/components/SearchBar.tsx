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
      className="mt-3 flex gap-3"
      onSubmit={handleSubmit}
    >
      <label className="sr-only" htmlFor="sound-search-query">
        Search sounds
      </label>
      <input
        id="sound-search-query"
        className="min-w-0 flex-1 rounded border border-surface-border bg-surface-raised px-3 py-2"
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search sounds"
        type="search"
        value={query}
      />
      <button className="rounded bg-accent px-4 py-2" type="submit">
        Go
      </button>
    </form>
  );
}
