/**
 * Provider-agnostic domain model for a playable sound / mix / track.
 * Every {@link SoundProvider} adapter maps its native payload onto this shape,
 * so the rest of the app never depends on a specific service's schema.
 */
export interface Sound {
  /** Stable, provider-scoped identifier. */
  readonly id: string;
  /** Which provider produced this record (e.g. "mixcloud"). */
  readonly provider: string;
  readonly title: string;
  /** Canonical web URL for the sound on the provider. */
  readonly url: string;
  /** Cover / artwork URL, or null when the provider has none. */
  readonly artworkUrl: string | null;
  readonly author: SoundAuthor;
  /** ISO-8601 creation timestamp, or null if unknown. */
  readonly createdAt: string | null;
  /** Duration in whole seconds, or null if unknown. */
  readonly durationSec: number | null;
  /** Play count, or null if the provider does not expose it. */
  readonly playCount: number | null;
  /** Free-form tags, empty when none. */
  readonly tags: readonly string[];
}

export interface SoundAuthor {
  readonly name: string;
  readonly url: string | null;
}

/** Format `durationSec` as `m:ss` / `h:mm:ss`, or `"—"` when unknown. */
export function formatDuration(durationSec: number | null): string {
  if (durationSec == null || durationSec < 0) return "—";
  const h = Math.floor(durationSec / 3600);
  const m = Math.floor((durationSec % 3600) / 60);
  const s = Math.floor(durationSec % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
