import axios, { type AxiosInstance } from "axios";

export interface HttpClientOptions {
  readonly baseURL: string;
  readonly timeoutMs?: number;
}

export interface ApiRequestErrorOptions {
  readonly status?: number;
  readonly code?: string;
  readonly cause?: unknown;
}

/** Provider-independent transport error exposed beyond the Axios boundary. */
export class ApiRequestError extends Error {
  readonly status: number | null;
  readonly code: string | null;
  readonly cause: unknown;

  constructor(message: string, options: ApiRequestErrorOptions = {}) {
    super(message);
    this.name = "ApiRequestError";
    this.status = options.status ?? null;
    this.code = options.code ?? null;
    this.cause = options.cause;
  }
}

/** Converts transport and unexpected failures into the application's stable error shape. */
function normalizeApiError(error: unknown): ApiRequestError {
  if (error instanceof ApiRequestError) return error;

  if (axios.isAxiosError(error)) {
    return new ApiRequestError(error.message, {
      status: error.response?.status,
      code: error.code,
      cause: error,
    });
  }

  return new ApiRequestError("An unexpected API error occurred.", {
    cause: error,
  });
}

/**
 * Creates the shared Axios boundary used by provider adapters.
 * Interceptors own cross-cutting headers and error normalization so adapters
 * only translate provider payloads into domain models.
 */
export function createHttpClient({
  baseURL,
  timeoutMs = 10_000,
}: HttpClientOptions): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: timeoutMs,
  });

  client.interceptors.request.use(
    (config) => {
      config.headers.set("Accept", "application/json");
      return config;
    },
    (error: unknown) => Promise.reject(normalizeApiError(error)),
  );

  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => Promise.reject(normalizeApiError(error)),
  );

  return client;
}
