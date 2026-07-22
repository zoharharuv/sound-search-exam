import type { Sound } from "@/domain/sound";
import type { Cursor } from "@/domain/pagination";

/** Hard application limit shared by every provider implementation. */
export const MAX_SEARCH_PAGE_SIZE = 6 as const;

/** Provider-neutral search request; cursors remain opaque outside adapters. */
export interface SoundSearchInput {
  readonly query: string;
  readonly cursor: Cursor | null;
  readonly pageSize: typeof MAX_SEARCH_PAGE_SIZE;
  readonly signal?: AbortSignal;
}

/** Normalized page returned to server-state consumers. */
export interface SoundSearchResult {
  readonly items: readonly Sound[];
  readonly nextCursor: Cursor | null;
}

/**
 * Data-layer seam that allows providers to change without affecting UI or
 * client-state code.
 */
export interface SoundProvider {
  readonly id: string;
  search(input: SoundSearchInput): Promise<SoundSearchResult>;
}
