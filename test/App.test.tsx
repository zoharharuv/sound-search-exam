import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import type { SoundSearchResult } from "@/api/sound-provider";
import { createAppStore } from "@/store/store";

const providerMocks = vi.hoisted(() => ({ search: vi.fn() }));

vi.mock("@/api/provider", () => ({
  soundProvider: {
    id: "test-provider",
    search: providerMocks.search,
  },
}));

function result(title: string): SoundSearchResult {
  return {
    items: [
      {
        id: `/${title}/`,
        title,
        url: "https://sounds.test/result/",
        artworkUrl: null,
        embedUrl: "https://player.test/result/",
      },
    ],
    nextCursor: null,
  };
}

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const store = createAppStore(null);

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
    providerMocks.search.mockReset();
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
});
