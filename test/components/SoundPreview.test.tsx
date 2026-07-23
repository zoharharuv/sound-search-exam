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

function PreviewHarness({ sound }: { readonly sound: Sound }) {
  const [isPlayerMounted, setIsPlayerMounted] = useState(false);

  return (
    <SoundPreview
      isPlayerMounted={isPlayerMounted}
      onRequestPlayer={() => setIsPlayerMounted(true)}
      shouldReduceMotion
      sound={sound}
    />
  );
}

describe("SoundPreview", () => {
  it("focuses the artwork and mounts the unchanged embed URL only after activation", async () => {
    const user = userEvent.setup();
    render(<PreviewHarness sound={playableSound} />);

    const artworkButton = screen.getByRole("button", {
      name: "Load player for Aurora Session",
    });
    expect(artworkButton).toHaveFocus();
    expect(
      screen.queryByTitle("Player for Aurora Session"),
    ).not.toBeInTheDocument();

    await user.click(artworkButton);

    const player = screen.getByTitle("Player for Aurora Session");
    expect(player).toHaveAttribute("src", playableSound.embedUrl);
    expect(player).toHaveAttribute("allow", "autoplay");

    const mountedPlayer = player;
    await user.click(
      screen.getByRole("button", {
        name: "Player loaded for Aurora Session",
      }),
    );
    expect(screen.getByTitle("Player for Aurora Session")).toBe(mountedPlayer);
  });

  it("renders artwork and playback fallbacks without mounting an iframe", async () => {
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
        shouldReduceMotion
        sound={unavailableSound}
      />,
    );

    const unavailableArtwork = screen.getByRole("button", {
      name: "Playback unavailable for Unavailable Session",
    });
    expect(unavailableArtwork).toHaveAttribute("aria-disabled", "true");
    expect(unavailableArtwork).toHaveFocus();
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
