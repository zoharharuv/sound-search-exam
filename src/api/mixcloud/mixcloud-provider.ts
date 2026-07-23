import type { AxiosInstance } from "axios";
import { ApiRequestError } from "@/api/http-client";
import {
  type SoundProvider,
  type SoundSearchInput,
  type SoundSearchResult,
} from "@/api/sound-provider";
import type { Sound } from "@/domain/sound";
import { mixcloudHttpClient } from "./mixcloud-http-client";

const MIXCLOUD_API_ORIGIN = "https://api.mixcloud.com";
const MIXCLOUD_SEARCH_PATH = "/search/";
const MIXCLOUD_WIDGET_URL = "https://www.mixcloud.com/widget/iframe/";

interface MixcloudPictures {
  readonly thumbnail?: string;
  readonly medium?: string;
  readonly large?: string;
  readonly extra_large?: string;
  readonly "640wx640h"?: string;
}

interface MixcloudCloudcast {
  readonly key: string;
  readonly url: string;
  readonly name: string;
  readonly pictures?: MixcloudPictures;
}

interface MixcloudPaging {
  readonly next?: string;
  readonly previous?: string;
}

interface MixcloudSearchResponse {
  readonly data: readonly MixcloudCloudcast[];
  readonly paging?: MixcloudPaging;
}

function createMixcloudWidgetUrl(canonicalUrl: string): string {
  const widgetUrl = new URL(MIXCLOUD_WIDGET_URL);
  widgetUrl.searchParams.set("feed", canonicalUrl);
  widgetUrl.searchParams.set("hide_cover", "1");
  widgetUrl.searchParams.set("light", "1");
  widgetUrl.searchParams.set("autoplay", "1");
  return widgetUrl.toString();
}

function mapCloudcast(cloudcast: MixcloudCloudcast): Sound {
  return {
    id: cloudcast.key,
    title: cloudcast.name,
    url: cloudcast.url,
    artworkUrl:
      cloudcast.pictures?.extra_large ??
      cloudcast.pictures?.["640wx640h"] ??
      cloudcast.pictures?.large ??
      cloudcast.pictures?.medium ??
      cloudcast.pictures?.thumbnail ??
      null,
    embedUrl: createMixcloudWidgetUrl(cloudcast.url),
  };
}

function validatePagingUrl(cursor: string, input: SoundSearchInput): string {
  let pagingUrl: URL;

  try {
    pagingUrl = new URL(cursor);
  } catch (error: unknown) {
    throw new ApiRequestError("Mixcloud returned an invalid paging URL.", {
      cause: error,
    });
  }

  const hasExpectedRequest =
    pagingUrl.origin === MIXCLOUD_API_ORIGIN &&
    pagingUrl.pathname === MIXCLOUD_SEARCH_PATH &&
    pagingUrl.username === "" &&
    pagingUrl.password === "" &&
    pagingUrl.hash === "" &&
    pagingUrl.searchParams.get("q") === input.query &&
    pagingUrl.searchParams.get("type") === "cloudcast" &&
    pagingUrl.searchParams.get("limit") === String(input.pageSize);

  if (!hasExpectedRequest) {
    throw new ApiRequestError("Mixcloud returned an unexpected paging URL.");
  }

  // Preserve the provider-owned URL exactly; do not calculate or rewrite paging.
  return cursor;
}

export class MixcloudSoundProvider implements SoundProvider {
  readonly id = "mixcloud";

  constructor(private readonly client: AxiosInstance = mixcloudHttpClient) {}

  async search(input: SoundSearchInput): Promise<SoundSearchResult> {
    const requestUrl =
      input.cursor === null
        ? MIXCLOUD_SEARCH_PATH
        : validatePagingUrl(input.cursor, input);

    const response = await this.client.get<MixcloudSearchResponse>(requestUrl, {
      params:
        input.cursor === null
          ? {
              q: input.query,
              type: "cloudcast",
              limit: input.pageSize,
            }
          : undefined,
      signal: input.signal,
    });

    return {
      items: response.data.data.slice(0, input.pageSize).map(mapCloudcast),
      nextCursor: response.data.paging?.next ?? null,
    };
  }
}

export const mixcloudProvider = new MixcloudSoundProvider();
