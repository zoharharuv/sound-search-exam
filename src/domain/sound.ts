/**
 * Provider-agnostic domain model for a playable sound / mix / track.
 * Every {@link SoundProvider} adapter maps its native payload onto this shape,
 * so the rest of the app never depends on a specific service's schema.
 */
export interface Sound {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly artworkUrl: string | null;
  readonly embedUrl: string | null;
}
