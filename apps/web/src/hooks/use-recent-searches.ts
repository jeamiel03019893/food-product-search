import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

import type { RecentSearch } from "@/types/product.types";

export const RECENT_SEARCHES_QUERY_KEY = ["recent-searches"] as const;

// Always enabled (not gated behind typing) so the list is already in
// cache by the time the user starts typing — no fetch delay before the
// autocomplete dropdown can show suggestions.
export const useRecentSearches = () =>
  useQuery({
    queryKey: RECENT_SEARCHES_QUERY_KEY,
    queryFn: () => apiGet<RecentSearch[]>("/products/recent-searches"),
  });
