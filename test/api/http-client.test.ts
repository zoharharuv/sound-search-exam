import axios, { AxiosError, CanceledError } from "axios";
import { describe, expect, it } from "vitest";
import { createHttpClient, isApiRequestCancelled } from "@/api/http-client";

describe("HTTP client error normalization", () => {
  it("marks Axios cancellation without exposing it as a normal failure", async () => {
    const client = createHttpClient({ baseURL: "https://example.test/" });

    const request = client.get("sounds", {
      adapter: () => Promise.reject(new CanceledError("cancelled")),
    });

    await expect(request).rejects.toMatchObject({
      name: "ApiRequestError",
      code: "ERR_CANCELED",
      isCancelled: true,
    });

    try {
      await request;
    } catch (error: unknown) {
      expect(isApiRequestCancelled(error)).toBe(true);
    }
  });

  it("keeps ordinary Axios failures visible and normalized", async () => {
    const client = createHttpClient({ baseURL: "https://example.test/" });

    await expect(
      client.get("sounds", {
        adapter: () =>
          Promise.reject(new AxiosError("network failed", "ERR_NETWORK")),
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        name: "ApiRequestError",
        code: "ERR_NETWORK",
        isCancelled: false,
      }),
    );

    expect(axios.isCancel(new AxiosError("network failed"))).toBe(false);
  });
});
