import { AnimatePresence, motion } from "framer-motion";
import type { Sound } from "@/domain/sound";
import type { ViewMode } from "@/storage/preferences-storage";

export interface SearchResultsProps {
  readonly results: readonly Sound[];
  readonly viewMode: ViewMode;
  readonly selectedSoundId: string | null;
  readonly shouldReduceMotion: boolean;
  readonly hasSearched: boolean;
  readonly isLoading: boolean;
  readonly isEmpty: boolean;
  readonly errorMessage: string | null;
  onSelect(sound: Sound): void;
  onRetry(): void;
}

export function SearchResults({
  results,
  viewMode,
  selectedSoundId,
  shouldReduceMotion,
  hasSearched,
  isLoading,
  isEmpty,
  errorMessage,
  onSelect,
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
    <ul
      aria-label="Sound search results"
      className={
        viewMode === "tile"
          ? "mt-4 grid min-w-0 max-w-full grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-2 min-[420px]:gap-3"
          : "mt-4 min-w-0 max-w-full space-y-2"
      }
    >
      <AnimatePresence initial={false}>
        {results
          .filter((sound) => sound.id !== selectedSoundId)
          .map((sound) => (
            <motion.li
              className="min-w-0 max-w-full"
              exit={
                shouldReduceMotion ? undefined : { opacity: 0, scale: 0.96 }
              }
              key={sound.id}
              layout={!shouldReduceMotion}
              transition={{ duration: shouldReduceMotion ? 0 : 0.28 }}
            >
              <button
                aria-label={
                  viewMode === "tile" ? `Select ${sound.title}` : undefined
                }
                className={`group w-full min-w-0 max-w-full overflow-hidden border border-surface-border bg-surface-raised text-left transition hover:-translate-y-0.5 hover:border-accent/60 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                  viewMode === "tile"
                    ? "h-full rounded-2xl"
                    : "flex min-h-16 items-center gap-3 rounded-xl p-2"
                }`}
                onClick={() => onSelect(sound)}
                type="button"
              >
                <motion.span
                  className={`relative block shrink-0 overflow-hidden bg-slate-900 ${
                    viewMode === "tile"
                      ? "aspect-square w-full"
                      : "h-12 w-12 rounded-lg"
                  }`}
                  layoutId={
                    shouldReduceMotion ? undefined : `sound-artwork:${sound.id}`
                  }
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.46,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {sound.artworkUrl ? (
                    <img
                      alt=""
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                      src={sound.artworkUrl}
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex h-full items-center justify-center bg-gradient-to-br from-accent-muted/50 via-slate-800 to-slate-950 text-2xl text-slate-300"
                    >
                      ♪
                    </span>
                  )}
                </motion.span>
                <span
                  className={`block min-w-0 font-medium text-slate-100 ${
                    viewMode === "tile"
                      ? "break-words px-3 py-3 text-sm leading-5"
                      : "truncate pr-3"
                  }`}
                >
                  {sound.title}
                </span>
              </button>
            </motion.li>
          ))}
      </AnimatePresence>
    </ul>
  );
}
