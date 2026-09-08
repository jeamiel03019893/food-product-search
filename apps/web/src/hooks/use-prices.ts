import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

import type { SubscriptionPrice } from "@/types/subscription.types";

// Always enabled (not just while the modal is open) so the status
// button can also derive its label from the price list; react-query
// caches by queryKey, so this doesn't add a duplicate fetch.
export const usePrices = () =>
  useQuery({
    queryKey: ["prices"],
    queryFn: () => apiGet<SubscriptionPrice[]>("/subscriptions/prices"),
  });
