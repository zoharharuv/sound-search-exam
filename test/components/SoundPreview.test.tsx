import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SoundPreview } from "@/components/SoundPreview";
import type { Sound } from "@/domain/sound";

const playableSound: Sound = {
  id: "/artist/aurora/",
  title: "Aurora Session",
  url: "https://sounds.test/aurora/",
  artworkUrl: "https://images.test/aurora.jpg",
  embedUrl: "https://player.test/aurora/?autoplay=1",
};

interface PreviewHarnessProps {
  readonly sound: Sound;
  readonly shouldCenterArtwork: boolean;
  readonly shouldReduceMotion: boolean;
}

function PreviewHarness({
  sound,
  shouldCenterArtwork,
  shouldReduceMotion,
}: PreviewHarnessProps) {
  const [isPlayerMounted, setIsPlayerMounted] = useState(false);

  return (
    <SoundPreview
      isPlayerMounted={isPlayerMounted}
      onRequestPlayer={() => setIsPlayerMounted(true)}
      shouldCenterArtwork={shouldCenterArtwork}
      shouldReduceMotion={shouldReduceMotion}
      sound={sound}
    />
  );
}

describe("SoundPreview", () => {
  it("focuses the artwork and mounts the unchanged embed URL only after activation", async () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    const user = userEvent.setup();
    const { rerender } = render(
      <PreviewHarness
        shouldCenterArtwork={false}
        shouldReduceMotion={false}
        sound={playableSound}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "Load player for Aurora Session",
      }),
    ).toHaveFocus();
    expect(scrollIntoView).not.toHaveBeenCalled();

    const centeredSound: Sound = {
      ...playableSound,
      id: "/artist/centered/",
      title: "Centered Session",
      embedUrl: "https://player.test/centered/?autoplay=1",
    };
    rerender(
      <PreviewHarness
        shouldCenterArtwork
        shouldReduceMotion={false}
        sound={centeredSound}
      />,
    );

    const artworkButton = screen.getByRole("button", {
      name: "Load player for Centered Session",
    });
    expect(artworkButton).toHaveFocus();
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
    expect(
      screen.queryByTitle("Player for Centered Session"),
    ).not.toBeInTheDocument();

    await user.click(artworkButton);

    const player = screen.getByTitle("Player for Centered Session");
    expect(player).toHaveAttribute("src", centeredSound.embedUrl);
    expect(player).toHaveAttribute("allow", "autoplay");

    const mountedPlayer = player;
    await user.click(
      screen.getByRole("button", {
        name: "Player loaded for Centered Session",
      }),
    );
    expect(screen.getByTitle("Player for Centered Session")).toBe(
      mountedPlayer,
    );
  });

  it("renders artwork and playback fallbacks without mounting an iframe", async () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    const unavailableSound: Sound = {
      ...playableSound,
      id: "/artist/unavailable/",
      title: "Unavailable Session",
      artworkUrl: null,
      embedUrl: null,
    };
    const onRequestPlayer = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <SoundPreview
        isPlayerMounted={false}
        onRequestPlayer={onRequestPlayer}
        shouldCenterArtwork
        shouldReduceMotion
        sound={unavailableSound}
      />,
    );

    const unavailableArtwork = screen.getByRole("button", {
      name: "Playback unavailable for Unavailable Session",
    });
    expect(unavailableArtwork).toHaveAttribute("aria-disabled", "true");
    expect(unavailableArtwork).toHaveFocus();
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "center",
    });
    expect(
      screen.getByText("Unavailable Session selected. Playback unavailable."),
    ).toBeInTheDocument();
    await user.click(unavailableArtwork);
    expect(onRequestPlayer).not.toHaveBeenCalled();
    expect(screen.getByText("Playback unavailable")).toBeInTheDocument();
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(container.querySelector("iframe")).not.toBeInTheDocument();
  });

  it("shows an instructional empty state", () => {
    render(
      <SoundPreview
        isPlayerMounted={false}
        onRequestPlayer={() => undefined}
        shouldCenterArtwork={false}
        shouldReduceMotion
        sound={null}
      />,
    );

    expect(
      screen.getByText("Select a sound to preview it"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByTitle(/Player for/)).not.toBeInTheDocument();
  });
});
