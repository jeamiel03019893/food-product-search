import { API_URL } from "./env";

// Mirrors apps/api's response envelope (src/libs/api-responses.ts):
// success responses carry `results`, error responses carry `error.message`.
interface ApiSuccessEnvelope<T> {
  success: true;
  status: number;
  results?: T;
  message?: string;
}

interface ApiErrorEnvelope {
  success: false;
  status: number;
  error: { message: string };
}

type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  const body = (await res.json()) as ApiEnvelope<T>;

  if (!body.success) {
    throw new ApiError(body.status, body.error.message);
  }

  return body.results as T;
};

export const apiGet = <T>(
  path: string,
  params?: Record<string, string | number | undefined>,
): Promise<T> => {
  const search = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return request<T>(`${path}${qs ? `?${qs}` : ""}`);
};

export const apiPost = <T>(path: string, data?: unknown): Promise<T> =>
  request<T>(path, {
    method: "POST",
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });
