import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

import type { AuthResponse } from "@/types/auth.types";

export const AUTH_QUERY_KEY = ["auth"] as const;

export const useAuth = () =>
  useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: () => apiGet<AuthResponse>("/auth"),
  });
