import type { AxiosInstance } from "axios";
import { describe, expect, it, vi } from "vitest";
import { MixcloudSoundProvider } from "@/api/mixcloud/mixcloud-provider";
import { MAX_SEARCH_PAGE_SIZE } from "@/api/sound-provider";

function createClientMock() {
  return {
    get: vi.fn(),
  } as unknown as AxiosInstance;
}

describe("MixcloudSoundProvider", () => {
  it("requests cloudcasts and maps the provider response", async () => {
    const client = createClientMock();
    const get = vi.mocked(client.get);
    get.mockResolvedValue({
      data: {
        data: [
          {
            key: "/dj/example-mix/",
            name: "Example Mix",
            url: "https://www.mixcloud.com/dj/example-mix/",
            pictures: {
              large: "https://images.test/large.jpg",
              extra_large: "https://images.test/extra-large.jpg",
            },
          },
        ],
        paging: {
          next: "https://api.mixcloud.com/search/?limit=6&offset=6&q=ambient&type=cloudcast",
        },
      },
    });
    const signal = new AbortController().signal;
    const provider = new MixcloudSoundProvider(client);

    const result = await provider.search({
      query: "ambient",
      cursor: null,
      pageSize: MAX_SEARCH_PAGE_SIZE,
      signal,
    });

    expect(get).toHaveBeenCalledWith("/search/", {
      params: { q: "ambient", type: "cloudcast", limit: 6 },
      signal,
    });
    expect(result).toEqual({
      items: [
        {
          id: "/dj/example-mix/",
          title: "Example Mix",
          url: "https://www.mixcloud.com/dj/example-mix/",
          artworkUrl: "https://images.test/extra-large.jpg",
          embedUrl:
            "https://www.mixcloud.com/widget/iframe/?feed=https%3A%2F%2Fwww.mixcloud.com%2Fdj%2Fexample-mix%2F&hide_cover=1&light=1&autoplay=1",
        },
      ],
      nextCursor:
        "https://api.mixcloud.com/search/?limit=6&offset=6&q=ambient&type=cloudcast",
    });
  });

  it("follows the exact validated paging URL without constructing an offset", async () => {
    const client = createClientMock();
    const get = vi.mocked(client.get);
    get.mockResolvedValue({ data: { data: [] } });
    const provider = new MixcloudSoundProvider(client);
    const cursor =
      "https://api.mixcloud.com/search/?limit=6&offset=6&q=deep+house&type=cloudcast";

    await provider.search({
      query: "deep house",
      cursor,
      pageSize: MAX_SEARCH_PAGE_SIZE,
    });

    expect(get).toHaveBeenCalledWith(cursor, {
      params: undefined,
      signal: undefined,
    });
  });

  it("rejects unexpected paging URLs inside the adapter", async () => {
    const client = createClientMock();
    const get = vi.mocked(client.get);
    const provider = new MixcloudSoundProvider(client);

    await expect(
      provider.search({
        query: "ambient",
        cursor:
          "https://example.test/search/?limit=6&offset=6&q=ambient&type=cloudcast",
        pageSize: MAX_SEARCH_PAGE_SIZE,
      }),
    ).rejects.toThrow("unexpected paging URL");
    expect(get).not.toHaveBeenCalled();
  });

  it("honors the requested page size and tolerates absent paging and artwork", async () => {
    const client = createClientMock();
    const get = vi.mocked(client.get);
    get.mockResolvedValue({
      data: {
        data: Array.from({ length: 3 }, (_, index) => ({
          key: `/dj/mix-${index}/`,
          name: `Mix ${index}`,
          url: `https://www.mixcloud.com/dj/mix-${index}/`,
        })),
      },
    });
    const provider = new MixcloudSoundProvider(client);
    const input = {
      query: "mix",
      cursor: null,
      pageSize: MAX_SEARCH_PAGE_SIZE,
    } as const;
    const requestedPageSize = 2;
    Object.defineProperty(input, "pageSize", { value: requestedPageSize });

    const result = await provider.search(input);

    expect(get).toHaveBeenCalledWith("/search/", {
      params: {
        q: "mix",
        type: "cloudcast",
        limit: requestedPageSize,
      },
      signal: undefined,
    });
    expect(result.items).toHaveLength(requestedPageSize);
    expect(result.items[0]?.artworkUrl).toBeNull();
    expect(result.nextCursor).toBeNull();
  });
});
