import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Sound } from "@/domain/sound";

export interface SoundPreviewProps {
  readonly sound: Sound | null;
  readonly isPlayerMounted: boolean;
  readonly shouldCenterArtwork: boolean;
  readonly shouldReduceMotion: boolean;
  onRequestPlayer(): void;
}

const PLAYER_ID = "selected-sound-player";

export function SoundPreview({
  sound,
  isPlayerMounted,
  shouldCenterArtwork,
  shouldReduceMotion,
  onRequestPlayer,
}: SoundPreviewProps) {
  const artworkButtonRef = useRef<HTMLButtonElement>(null);
  const embedUrl = sound?.embedUrl ?? null;
  const hasEmbedUrl = embedUrl !== null;

  useEffect(() => {
    if (!sound) return;

    const artworkButton = artworkButtonRef.current;
    artworkButton?.focus({ preventScroll: true });
    if (artworkButton && shouldCenterArtwork) {
      artworkButton.scrollIntoView({
        behavior: shouldReduceMotion ? "auto" : "smooth",
        block: "center",
      });
    }
  }, [sound]);

  return (
    <div className="mt-4 min-w-0 max-w-full min-[420px]:mt-5">
      <p aria-live="polite" className="sr-only">
        {sound
          ? `${sound.title} selected. ${
              hasEmbedUrl
                ? "Activate the artwork to load its player."
                : "Playback unavailable."
            }`
          : ""}
      </p>

      <AnimatePresence initial={false}>
        {sound ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="flex w-full min-w-0 max-w-full flex-col items-center"
            exit={shouldReduceMotion ? undefined : { opacity: 0 }}
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            key={sound.id}
            transition={{ duration: shouldReduceMotion ? 0 : 0.24 }}
          >
            <button
              aria-controls={hasEmbedUrl ? PLAYER_ID : undefined}
              aria-expanded={hasEmbedUrl ? isPlayerMounted : undefined}
              aria-disabled={!hasEmbedUrl}
              aria-label={
                hasEmbedUrl
                  ? isPlayerMounted
                    ? `Player loaded for ${sound.title}`
                    : `Load player for ${sound.title}`
                  : `Playback unavailable for ${sound.title}`
              }
              className="group w-full min-w-0 max-w-sm rounded-2xl text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/50 min-[420px]:rounded-3xl"
              onClick={() => {
                if (hasEmbedUrl && !isPlayerMounted) {
                  onRequestPlayer();
                }
              }}
              ref={artworkButtonRef}
              type="button"
            >
              <motion.span
                className="relative block aspect-square w-full max-w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/40 min-[420px]:rounded-3xl"
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
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    src={sound.artworkUrl}
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-full items-center justify-center bg-gradient-to-br from-accent-muted/50 via-slate-800 to-slate-950 text-7xl text-slate-200"
                  >
                    ♪
                  </span>
                )}
                {hasEmbedUrl ? (
                  <span className="absolute inset-x-2 bottom-2 rounded-full bg-slate-950/80 px-2 py-2 text-center text-xs font-semibold text-white backdrop-blur transition group-hover:bg-accent/90 min-[420px]:inset-x-4 min-[420px]:bottom-4 min-[420px]:px-4 min-[420px]:text-sm">
                    {isPlayerMounted ? "Player loaded" : "Load player"}
                  </span>
                ) : null}
              </motion.span>
            </button>

            <h3 className="mt-4 max-w-full break-words text-center text-base font-semibold text-white min-[420px]:mt-5 min-[420px]:text-lg">
              {sound.title}
            </h3>
            {hasEmbedUrl ? (
              <p className="mt-2 text-center text-sm leading-6 text-slate-400">
                {isPlayerMounted
                  ? "Player loaded below. Use its Play control if autoplay is blocked."
                  : "Activate the artwork to load the player."}
              </p>
            ) : (
              <p className="mt-2 text-center text-sm text-amber-300">
                Playback unavailable
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            animate={{ opacity: 1 }}
            className="mx-auto flex aspect-square w-full min-w-0 max-w-sm flex-col items-center justify-center rounded-2xl border border-dashed border-surface-border bg-slate-950/30 p-4 text-center min-[420px]:rounded-3xl min-[420px]:p-8"
            exit={shouldReduceMotion ? undefined : { opacity: 0 }}
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            key="empty-preview"
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
          >
            <span aria-hidden="true" className="text-5xl text-slate-600">
              ♪
            </span>
            <p className="mt-4 font-medium text-slate-300">
              Select a sound to preview it
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Its artwork and playback control will appear here.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {sound !== null && hasEmbedUrl && isPlayerMounted ? (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-surface-border bg-white shadow-xl shadow-black/20 min-[420px]:mt-6"
          id={PLAYER_ID}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          key={sound.id}
          transition={{ duration: shouldReduceMotion ? 0 : 0.24 }}
        >
          <iframe
            allow="autoplay"
            className="block aspect-[3/1] min-h-32 w-full max-w-full border-0"
            src={embedUrl}
            title={`Player for ${sound.title}`}
          />
        </motion.div>
      ) : null}
    </div>
  );
}
