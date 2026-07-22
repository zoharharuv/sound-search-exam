import type { Sound } from "@/domain/sound";

export interface SearchResultsProps {
  readonly results: readonly Sound[];
  readonly hasSearched: boolean;
  readonly isLoading: boolean;
  readonly isEmpty: boolean;
  readonly errorMessage: string | null;
  onRetry(): void;
}

export function SearchResults({
  results,
  hasSearched,
  isLoading,
  isEmpty,
  errorMessage,
  onRetry,
}: SearchResultsProps) {
  if (!hasSearched) {
    return (
      <p className="mt-3 text-slate-400">Search results will appear here.</p>
    );
  }

  if (isLoading) {
    return (
      <p aria-live="polite" className="mt-3 text-slate-300" role="status">
        Loading sounds…
      </p>
    );
  }

  if (errorMessage) {
    return (
      <div className="mt-3" role="alert">
        <p>{errorMessage}</p>
        <button className="mt-2 underline" onClick={onRetry} type="button">
          Retry
        </button>
      </div>
    );
  }

  if (isEmpty) {
    return <p className="mt-3 text-slate-400">No matching sounds found.</p>;
  }

  return (
    <ul className="mt-3 space-y-2" aria-label="Sound search results">
      {results.map((sound) => (
        <li key={sound.id} className="rounded bg-surface-raised px-3 py-2">
          {sound.title}
        </li>
      ))}
    </ul>
  );
}
