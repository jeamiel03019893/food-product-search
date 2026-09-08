// Not a secret — just the backend's base URL — so a sensible local-dev
// default is fine here, unlike apps/api's eager, no-fallback validation.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
