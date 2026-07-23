import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  SearchResults,
  type SearchResultsProps,
} from "@/components/SearchResults";
import type { Sound } from "@/domain/sound";

const sounds: readonly Sound[] = [
  {
    id: "/artist/aurora/",
    title: "Aurora Session",
    url: "https://sounds.test/aurora/",
    artworkUrl: "https://images.test/aurora.jpg",
    embedUrl: "https://player.test/aurora/",
  },
  {
    id: "/artist/night-drive/",
    title: "Night Drive",
    url: "https://sounds.test/night-drive/",
    artworkUrl: null,
    embedUrl: "https://player.test/night-drive/",
  },
];

function defaultProps(): SearchResultsProps {
  return {
    results: sounds,
    viewMode: "list",
    selectedSoundId: null,
    shouldReduceMotion: true,
    hasSearched: true,
    isLoading: false,
    isEmpty: false,
    errorMessage: null,
    onSelect: vi.fn(),
    onRetry: vi.fn(),
  };
}

describe("SearchResults", () => {
  it("renders compact semantic list buttons and selects the exact Sound", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <SearchResults {...defaultProps()} onSelect={onSelect} />,
    );

    expect(container.querySelector("ul")).toHaveClass("space-y-2");

    const auroraButton = screen.getByRole("button", {
      name: "Aurora Session",
    });
    auroraButton.focus();
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenLastCalledWith(sounds[0]);

    const nightDriveButton = screen.getByRole("button", {
      name: "Night Drive",
    });
    nightDriveButton.focus();
    await user.keyboard(" ");
    expect(onSelect).toHaveBeenLastCalledWith(sounds[1]);
  });

  it("renders a responsive artwork grid with title-based accessible names", () => {
    const { container } = render(
      <SearchResults {...defaultProps()} viewMode="tile" />,
    );

    expect(container.querySelector("ul")).toHaveClass(
      "grid",
      "grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))]",
    );
    expect(
      screen.getByRole("button", { name: "Select Aurora Session" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Select Night Drive" }),
    ).toBeInTheDocument();
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
    expect(screen.getByText("♪")).toHaveAttribute("aria-hidden", "true");
  });

  it("removes only the selected source item and restores it for a new selection", async () => {
    const props = defaultProps();
    const { rerender } = render(
      <SearchResults {...props} selectedSoundId={sounds[0]?.id ?? null} />,
    );

    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Aurora Session" }),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: "Night Drive" }),
    ).toBeInTheDocument();

    rerender(
      <SearchResults {...props} selectedSoundId={sounds[1]?.id ?? null} />,
    );

    expect(
      await screen.findByRole("button", { name: "Aurora Session" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Night Drive" }),
      ).not.toBeInTheDocument(),
    );
  });
});
