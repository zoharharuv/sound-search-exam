import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import type { SoundSearchResult } from "@/api/sound-provider";
import type { Sound } from "@/domain/sound";
import type { KeyValueStorage } from "@/storage/search-history-storage";
import { createAppStore } from "@/store/store";
import { DESKTOP_BREAKPOINT_PX } from "@/styles/responsive-breakpoints";

const providerMocks = vi.hoisted(() => ({ search: vi.fn() }));

vi.mock("@/api/provider", () => ({
  soundProvider: {
    id: "test-provider",
    search: providerMocks.search,
  },
}));

vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return { ...actual, useReducedMotion: () => true };
});

interface SoundOptions {
  readonly artworkUrl?: string | null;
  readonly embedUrl?: string | null;
}

function sound(title: string, options: SoundOptions = {}): Sound {
  const slug = title.toLowerCase().replace(/\s+/g, "-");
  return {
    id: `/${slug}/`,
    title,
    url: `https://sounds.test/${slug}/`,
    artworkUrl: options.artworkUrl ?? null,
    embedUrl:
      options.embedUrl === undefined
        ? `https://player.test/${slug}/?autoplay=1`
        : options.embedUrl,
  };
}

function result(
  title: string,
  options: SoundOptions = {},
  nextCursor: string | null = null,
): SoundSearchResult {
  return {
    items: [sound(title, options)],
    nextCursor,
  };
}

function renderApp(storage: KeyValueStorage | null = null) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const store = createAppStore(storage);

  return {
    store,
    queryClient,
    ...render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </Provider>,
    ),
  };
}

describe("App", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    providerMocks.search.mockReset();
    window.localStorage.clear();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: DESKTOP_BREAKPOINT_PX,
    });
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("renders the Day 1 search page shell", () => {
    renderApp();

    expect(
      screen.getByRole("heading", { level: 1, name: "Sound Search" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("searchbox", { name: "Search sounds" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(
      screen.getByRole("heading", { name: "Recent searches" }),
    ).toBeInTheDocument();
  });

  it("shows loading, renders results, records history, and searches recent terms immediately", async () => {
    let resolveFirst: ((value: SoundSearchResult) => void) | undefined;
    providerMocks.search
      .mockImplementationOnce(
        () =>
          new Promise<SoundSearchResult>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce(result("Recent result"));
    const user = userEvent.setup();
    renderApp();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search sounds" }), {
      target: { value: "Ambient" },
    });
    await user.click(screen.getByRole("button", { name: "Go" }));
    expect(screen.getByRole("status")).toHaveTextContent("Loading sounds");

    resolveFirst?.(result("Ambient result"));
    expect(await screen.findByText("Ambient result")).toBeInTheDocument();
    const recentButton = await screen.findByRole("button", {
      name: "Ambient",
    });

    await user.click(recentButton);
    await waitFor(() => expect(providerMocks.search).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Recent result")).toBeInTheDocument();
  });

  it("scrolls recent mobile searches without moving focus and does not scroll on desktop", async () => {
    providerMocks.search.mockResolvedValue(result("Ambient result"));
    const scrollTo = vi
      .spyOn(window, "scrollTo")
      .mockImplementation(() => undefined);
    const user = userEvent.setup();
    renderApp();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search sounds" }), {
      target: { value: "Ambient" },
    });
    await user.click(screen.getByRole("button", { name: "Go" }));
    const recentButton = await screen.findByRole("button", {
      name: "Ambient",
    });

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 375,
    });
    await user.click(recentButton);

    await waitFor(() => expect(providerMocks.search).toHaveBeenCalledTimes(2));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
    expect(recentButton).toHaveFocus();

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: DESKTOP_BREAKPOINT_PX,
    });
    await user.click(recentButton);

    await waitFor(() => expect(providerMocks.search).toHaveBeenCalledTimes(3));
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it("shows a visible error and Retry repeats the active request", async () => {
    providerMocks.search
      .mockRejectedValueOnce(new Error("provider unavailable"))
      .mockResolvedValueOnce(result("Recovered result"));
    const user = userEvent.setup();
    renderApp();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search sounds" }), {
      target: { value: "Jazz" },
    });
    await user.click(screen.getByRole("button", { name: "Go" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to search sounds",
    );
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Recovered result")).toBeInTheDocument();
    expect(providerMocks.search).toHaveBeenCalledTimes(2);
  });

  it("selects exact results, transfers focus, mounts the player only from artwork, and restores the old source", async () => {
    providerMocks.search.mockResolvedValue({
      items: [sound("First result"), sound("Second result")],
      nextCursor: null,
    });
    const user = userEvent.setup();
    renderApp();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search sounds" }), {
      target: { value: "Ambient" },
    });
    await user.click(screen.getByRole("button", { name: "Go" }));

    const firstResult = await screen.findByRole("button", {
      name: "First result",
    });
    await user.click(firstResult);

    const firstArtwork = await screen.findByRole("button", {
      name: "Load player for First result",
    });
    expect(firstArtwork).toHaveFocus();
    expect(
      screen.queryByRole("button", { name: "First result" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTitle("Player for First result"),
    ).not.toBeInTheDocument();

    await user.click(firstArtwork);
    const firstPlayer = screen.getByTitle("Player for First result");
    expect(firstPlayer).toHaveAttribute(
      "src",
      "https://player.test/first-result/?autoplay=1",
    );
    expect(firstPlayer).toHaveAttribute("allow", "autoplay");

    await user.click(
      screen.getByRole("button", {
        name: "Player loaded for First result",
      }),
    );
    expect(screen.getByTitle("Player for First result")).toBe(firstPlayer);

    await user.click(screen.getByRole("button", { name: "Second result" }));
    expect(
      await screen.findByRole("button", {
        name: "First result",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Second result" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Load player for Second result",
      }),
    ).toHaveFocus();
    expect(
      screen.queryByTitle("Player for First result"),
    ).not.toBeInTheDocument();
  });

  it("clears preview state on input changes without clearing displayed results", async () => {
    providerMocks.search.mockResolvedValue(result("Ambient result"));
    const user = userEvent.setup();
    renderApp();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search sounds" }), {
      target: { value: "Ambient" },
    });
    await user.click(screen.getByRole("button", { name: "Go" }));
    await user.click(
      await screen.findByRole("button", {
        name: "Ambient result",
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "Load player for Ambient result",
      }),
    );
    expect(screen.getByTitle("Player for Ambient result")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search sounds" }), {
      target: { value: "Ambient edit" },
    });

    expect(
      screen.getByText("Select a sound to preview it"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTitle("Player for Ambient result"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ambient result" }),
    ).toBeInTheDocument();
  });

  it("clears selection for page transitions and replaced result identities", async () => {
    providerMocks.search.mockImplementation(
      ({ cursor }: { cursor: string | null }) =>
        Promise.resolve(
          cursor === null
            ? result("Page one", {}, "cursor-2")
            : result("Page two"),
        ),
    );
    const user = userEvent.setup();
    const { queryClient } = renderApp();
    const scrollTo = vi
      .spyOn(window, "scrollTo")
      .mockImplementation(() => undefined);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search sounds" }), {
      target: { value: "Pages" },
    });
    await user.click(screen.getByRole("button", { name: "Go" }));
    await user.click(await screen.findByRole("button", { name: "Page one" }));
    expect(
      screen.getByRole("button", { name: "Load player for Page one" }),
    ).toHaveFocus();

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 375,
    });
    const nextButton = screen.getByRole("button", { name: "Next" });
    await user.click(nextButton);
    expect(
      screen.getByText("Select a sound to preview it"),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: "Page two" }),
    ).toBeInTheDocument();
    expect(scrollTo).not.toHaveBeenCalled();
    expect(nextButton).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Page two" }));
    expect(
      screen.getByRole("button", { name: "Load player for Page two" }),
    ).toHaveFocus();

    act(() => {
      queryClient.setQueryData(
        ["sound-search", "test-provider", "Pages", "cursor-2"],
        result("Page two", {
          artworkUrl: "https://images.test/replaced-page-two.jpg",
        }),
      );
    });

    await waitFor(() =>
      expect(
        screen.getByText("Select a sound to preview it"),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: "Page two" }),
    ).toBeInTheDocument();

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: DESKTOP_BREAKPOINT_PX,
    });
    const previousButton = screen.getByRole("button", { name: "Previous" });
    await user.click(previousButton);

    expect(
      await screen.findByRole("button", { name: "Page one" }),
    ).toBeInTheDocument();
    expect(scrollTo).not.toHaveBeenCalled();
    expect(previousButton).toHaveFocus();
  });

  it("hydrates and persists the real List and Tile result layouts", async () => {
    window.localStorage.setItem(
      "sound-search:preferences",
      JSON.stringify({ viewMode: "tile" }),
    );
    providerMocks.search.mockResolvedValue(
      result("Tile result", {
        artworkUrl: "https://images.test/tile-result.jpg",
      }),
    );
    const user = userEvent.setup();
    renderApp(window.localStorage);

    expect(screen.getByRole("button", { name: "Tile" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.change(screen.getByRole("searchbox", { name: "Search sounds" }), {
      target: { value: "Tiles" },
    });
    await user.click(screen.getByRole("button", { name: "Go" }));
    expect(
      await screen.findByRole("button", { name: "Select Tile result" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "List" }));
    expect(screen.getByRole("button", { name: "List" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "Tile result" }),
    ).toBeInTheDocument();
    expect(
      JSON.parse(
        window.localStorage.getItem("sound-search:preferences") ?? "{}",
      ),
    ).toEqual({ viewMode: "list" });
  });

  it("shows missing artwork and embed fallbacks without mounting a player", async () => {
    providerMocks.search.mockResolvedValue(
      result("Unavailable result", { artworkUrl: null, embedUrl: null }),
    );
    const user = userEvent.setup();
    renderApp();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search sounds" }), {
      target: { value: "Unavailable" },
    });
    await user.click(screen.getByRole("button", { name: "Go" }));
    await user.click(
      await screen.findByRole("button", {
        name: "Unavailable result",
      }),
    );

    expect(
      screen.getByRole("button", {
        name: "Playback unavailable for Unavailable result",
      }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("Playback unavailable")).toBeInTheDocument();
    expect(screen.queryByTitle(/Player for/)).not.toBeInTheDocument();
  });
});
