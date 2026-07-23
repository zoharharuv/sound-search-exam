import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Sound } from "@/domain/sound";

export interface SoundPreviewProps {
  readonly sound: Sound | null;
  readonly isPlayerMounted: boolean;
  readonly shouldReduceMotion: boolean;
  onRequestPlayer(): void;
}

const PLAYER_ID = "selected-sound-player";

export function SoundPreview({
  sound,
  isPlayerMounted,
  shouldReduceMotion,
  onRequestPlayer,
}: SoundPreviewProps) {
  const artworkButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!sound) return;
    artworkButtonRef.current?.focus({ preventScroll: true });
  }, [sound]);

  return (
    <div className="mt-5">
      <p aria-live="polite" className="sr-only">
        {sound
          ? `${sound.title} selected. Activate the artwork to load its player.`
          : ""}
      </p>

      <AnimatePresence initial={false}>
        {sound ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="flex flex-col items-center"
            exit={shouldReduceMotion ? undefined : { opacity: 0 }}
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            key={sound.id}
            transition={{ duration: shouldReduceMotion ? 0 : 0.24 }}
          >
            <button
              aria-controls={sound.embedUrl === null ? undefined : PLAYER_ID}
              aria-expanded={
                sound.embedUrl === null ? undefined : isPlayerMounted
              }
              aria-disabled={sound.embedUrl === null}
              aria-label={
                sound.embedUrl === null
                  ? `Playback unavailable for ${sound.title}`
                  : isPlayerMounted
                    ? `Player loaded for ${sound.title}`
                    : `Load player for ${sound.title}`
              }
              className="group w-full max-w-sm rounded-3xl text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/50"
              onClick={() => {
                if (sound.embedUrl !== null && !isPlayerMounted) {
                  onRequestPlayer();
                }
              }}
              ref={artworkButtonRef}
              type="button"
            >
              <motion.span
                className="relative block aspect-square overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/40"
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
                {sound.embedUrl !== null ? (
                  <span className="absolute inset-x-4 bottom-4 rounded-full bg-slate-950/80 px-4 py-2 text-center text-sm font-semibold text-white backdrop-blur transition group-hover:bg-accent/90">
                    {isPlayerMounted ? "Player loaded" : "Load player"}
                  </span>
                ) : null}
              </motion.span>
            </button>

            <h3 className="mt-5 text-center text-lg font-semibold text-white">
              {sound.title}
            </h3>
            {sound.embedUrl === null ? (
              <p className="mt-2 text-center text-sm text-amber-300">
                Playback unavailable
              </p>
            ) : (
              <p className="mt-2 text-center text-sm leading-6 text-slate-400">
                {isPlayerMounted
                  ? "Player loaded below. Use its Play control if autoplay is blocked."
                  : "Activate the artwork to load the player."}
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            animate={{ opacity: 1 }}
            className="mx-auto flex aspect-square w-full max-w-sm flex-col items-center justify-center rounded-3xl border border-dashed border-surface-border bg-slate-950/30 p-8 text-center"
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

      {sound !== null && sound.embedUrl !== null && isPlayerMounted ? (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 overflow-hidden rounded-2xl border border-surface-border bg-white shadow-xl shadow-black/20"
          id={PLAYER_ID}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          key={sound.id}
          transition={{ duration: shouldReduceMotion ? 0 : 0.24 }}
        >
          <iframe
            allow="autoplay"
            className="block h-32 w-full border-0"
            src={sound.embedUrl}
            title={`Player for ${sound.title}`}
          />
        </motion.div>
      ) : null}
    </div>
  );
}
