import { createHttpClient } from "@/api/http-client";

export const mixcloudHttpClient = createHttpClient({
  baseURL: "https://api.mixcloud.com/",
});
